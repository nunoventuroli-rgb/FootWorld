import {
  POSICOES,
  PRIMEIRO_NOME,
  SOBRENOME,
  PosKey,
  FORMATIONS,
} from "./data";
import { randomName } from "./names";

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const clamp = (v: number) => Math.max(30, Math.min(99, Math.round(v)));

export type GenPlayer = {
  name: string;
  position: PosKey;
  ataque: number;
  meio: number;
  defesa: number;
  idade: number;
  forma: number;
  potential: number;
};

export function overall(p: { ataque: number; meio: number; defesa: number; position: string }): number {
  // Overall equilibrado: usa a média dos 3 atributos com leve peso no stat-chave.
  // Isso evita overalls inflados (antes o stat-chave dominava e todos ficavam 90+).
  const { ataque, meio, defesa, position } = p;
  const media = (ataque + meio + defesa) / 3;
  let chave: number;
  switch (position) {
    case "ATA": chave = ataque; break;
    case "MEI": chave = meio; break;
    case "VOL": chave = (meio + defesa) / 2; break;
    case "ZAG":
    case "LAT": chave = defesa; break;
    case "GOL": chave = defesa; break;
    default: chave = media;
  }
  // 60% média geral + 40% atributo-chave => valores mais realistas
  return Math.round(media * 0.6 + chave * 0.4);
}

export function marketValue(p: { ataque: number; meio: number; defesa: number; idade: number; position: string; potential?: number }): number {
  const ovr = overall(p);
  // curva mais realista: craques (85+) valem muito mais que medianos
  // fator idade: pico aos 24-26; jovens promissores valem mais, veteranos menos
  let fatorIdade: number;
  if (p.idade <= 20) fatorIdade = 1.25;
  else if (p.idade <= 26) fatorIdade = 1.35;
  else if (p.idade <= 29) fatorIdade = 1.0;
  else if (p.idade <= 32) fatorIdade = 0.55;
  else fatorIdade = 0.25;
  // bônus de potencial para jovens (limitado, para não explodir o valor)
  if (p.potential && p.idade <= 23) {
    const room = Math.min(15, Math.max(0, p.potential - ovr));
    fatorIdade *= 1 + room * 0.02;
  }
  // curva realista: OVR 70 ~ €6M, OVR 75 ~ €12M, OVR 80 ~ €22M, OVR 85 ~ €37M
  const base = Math.pow(Math.max(1, ovr - 48), 3.5) * 120;
  // teto rígido: nenhum jogador passa de €150M
  const val = Math.min(150_000_000, base * fatorIdade);
  // arredonda para valores "bonitos"
  if (val >= 20_000_000) return Math.round(val / 500_000) * 500_000;
  if (val >= 1_000_000) return Math.round(val / 100_000) * 100_000;
  return Math.max(50_000, Math.round(val / 10_000) * 10_000);
}

export function genPlayer(position: PosKey, nivelBase: number, country?: string): GenPlayer {
  const name = country ? randomName(country) : `${pick(PRIMEIRO_NOME)} ${pick(SOBRENOME)}`;
  const v = randInt(-8, 8);
  let ataque: number, meio: number, defesa: number;
  switch (position) {
    case "ATA":
      ataque = nivelBase + v; meio = nivelBase - 10; defesa = nivelBase - 25; break;
    case "MEI":
      ataque = nivelBase - 8; meio = nivelBase + v; defesa = nivelBase - 12; break;
    case "VOL":
      ataque = nivelBase - 18; meio = nivelBase + v; defesa = nivelBase - 2; break;
    case "ZAG":
    case "LAT":
      ataque = nivelBase - 22; meio = nivelBase - 10; defesa = nivelBase + v; break;
    default: // GOL
      ataque = nivelBase - 40; meio = nivelBase - 30; defesa = nivelBase + v;
  }
  const idade = randInt(17, 35);
  const base = clamp((clamp(ataque) + clamp(meio) + clamp(defesa)) / 3);
  // younger players have more room to grow
  const growth = idade <= 21 ? randInt(4, 16) : idade <= 25 ? randInt(1, 8) : randInt(0, 3);
  return {
    name,
    position,
    ataque: clamp(ataque),
    meio: clamp(meio),
    defesa: clamp(defesa),
    idade,
    forma: randInt(78, 100),
    potential: clamp(base + growth),
  };
}

// Prospect: young player with high potential (for scouts / youth academy)
export function genProspect(nivelBase: number, minAge = 15, maxAge = 19, country?: string): GenPlayer {
  const positions: PosKey[] = ["GOL", "ZAG", "LAT", "VOL", "MEI", "ATA"];
  const pos = pick(positions);
  const p = genPlayer(pos, nivelBase, country);
  p.idade = randInt(minAge, maxAge);
  const cur = Math.round((p.ataque + p.meio + p.defesa) / 3);
  p.potential = clamp(cur + randInt(10, 28));
  p.forma = randInt(70, 95);
  return p;
}

export function genSquad(nivelBase: number, country?: string): GenPlayer[] {
  const squad: GenPlayer[] = [];
  // starters (11) roughly following default positions
  for (const pos of POSICOES) {
    squad.push(genPlayer(pos, nivelBase + randInt(-4, 5), country));
  }
  // bench / reserves (7 extra players)
  const reservePositions: PosKey[] = ["GOL", "ZAG", "LAT", "VOL", "MEI", "ATA", "ATA"];
  for (const pos of reservePositions) {
    squad.push(genPlayer(pos, nivelBase + randInt(-10, 0), country));
  }
  return squad;
}

// ---------- Match simulation ----------

export type SimTeam = {
  id: number;
  name: string;
  starters: { ataque: number; meio: number; defesa: number; forma: number; position: string }[];
};

function sectorForce(t: SimTeam, sector: "ataque" | "meio" | "defesa"): number {
  if (t.starters.length === 0) return 50;
  const sum = t.starters.reduce((acc, p) => acc + (p as never)[sector] * (p.forma / 100), 0);
  return sum / t.starters.length;
}

function generalForce(t: SimTeam): { atk: number; def: number } {
  const atk = sectorForce(t, "ataque") * 0.6 + sectorForce(t, "meio") * 0.4;
  const def = sectorForce(t, "defesa") * 0.7 + sectorForce(t, "meio") * 0.3;
  return { atk, def };
}

function expectedGoals(atk: number, def: number): number {
  const diff = atk - def;
  return Math.max(0.2, 1.3 + diff / 42);
}

function poisson(mean: number): number {
  const l = Math.exp(-mean);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= Math.random();
  } while (p > l);
  return k - 1;
}

export function simulateMatch(home: SimTeam, away: SimTeam): { homeGoals: number; awayGoals: number } {
  const fh = generalForce(home);
  const fa = generalForce(away);
  const homeAtk = fh.atk + 5; // home advantage
  const meanHome = expectedGoals(homeAtk, fa.def);
  const meanAway = expectedGoals(fa.atk, fh.def);
  return { homeGoals: poisson(meanHome), awayGoals: poisson(meanAway) };
}

// pick scorers weighted by attacking ability among starters
export function pickScorers(
  team: { id: number; starters: { id: number; name: string; ataque: number; meio: number }[] },
  goals: number
): { playerId: number; name: string }[] {
  const result: { playerId: number; name: string }[] = [];
  if (team.starters.length === 0) return result;
  const weights = team.starters.map((p) => Math.max(1, p.ataque * 0.7 + p.meio * 0.3 - 30));
  const total = weights.reduce((a, b) => a + b, 0);
  for (let g = 0; g < goals; g++) {
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    const p = team.starters[idx];
    result.push({ playerId: p.id, name: p.name });
  }
  return result;
}

// ---------- Calendar (double round-robin) ----------

export function buildCalendar(teamIds: number[]): { round: number; home: number; away: number }[] {
  const ids = [...teamIds];
  if (ids.length % 2 !== 0) ids.push(-1); // bye
  const n = ids.length;
  const rounds: { round: number; home: number; away: number }[] = [];
  const fixed = ids[0];
  let rest = ids.slice(1);

  const firstLeg: { home: number; away: number }[][] = [];
  for (let r = 0; r < n - 1; r++) {
    const arrangement = [fixed, ...rest];
    const roundGames: { home: number; away: number }[] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = arrangement[i];
      const away = arrangement[n - 1 - i];
      if (home !== -1 && away !== -1) {
        // alternate home/away for balance
        if (r % 2 === 0) roundGames.push({ home, away });
        else roundGames.push({ home: away, away: home });
      }
    }
    firstLeg.push(roundGames);
    rest = [rest[rest.length - 1], ...rest.slice(0, rest.length - 1)];
  }

  firstLeg.forEach((games, r) => {
    games.forEach((g) => rounds.push({ round: r + 1, home: g.home, away: g.away }));
  });
  const offset = firstLeg.length;
  firstLeg.forEach((games, r) => {
    games.forEach((g) => rounds.push({ round: offset + r + 1, home: g.away, away: g.home }));
  });
  return rounds;
}

export function formatMoney(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
}

export function slotsForFormation(formation: string) {
  return (FORMATIONS[formation] ?? FORMATIONS["4-4-2"]).slots;
}

// ---------- Tactics / morale modifiers ----------

export type Tactics = {
  mentality: string; // ofensivo | equilibrado | defensivo | retranca
  pressing: string; // alto | medio | baixo
  tempo: string; // rapido | normal | cadenciado
  morale: number; // 0-100
};

export const MENTALITIES = ["retranca", "defensivo", "equilibrado", "ofensivo", "all-out"];
export const PRESSINGS = ["baixo", "medio", "alto"];
export const TEMPOS = ["cadenciado", "normal", "rapido"];

export function tacticalMods(t: Tactics): { atk: number; def: number } {
  let atk = 0;
  let def = 0;
  switch (t.mentality) {
    case "all-out": atk += 10; def -= 8; break;
    case "ofensivo": atk += 5; def -= 4; break;
    case "defensivo": atk -= 4; def += 5; break;
    case "retranca": atk -= 8; def += 10; break;
    default: break;
  }
  switch (t.pressing) {
    case "alto": atk += 3; def += 2; break;
    case "baixo": atk -= 2; def -= 1; break;
    default: break;
  }
  switch (t.tempo) {
    case "rapido": atk += 3; break;
    case "cadenciado": def += 2; atk -= 1; break;
    default: break;
  }
  // morale swing: +/- up to ~6
  const moraleMod = (t.morale - 60) / 7;
  atk += moraleMod;
  def += moraleMod;
  return { atk, def };
}

export function simulateMatchT(
  home: SimTeam,
  away: SimTeam,
  homeT: Tactics,
  awayT: Tactics
): { homeGoals: number; awayGoals: number } {
  const fh = generalForce(home);
  const fa = generalForce(away);
  const hm = tacticalMods(homeT);
  const am = tacticalMods(awayT);
  const homeAtk = fh.atk + 5 + hm.atk;
  const homeDef = fh.def + hm.def;
  const awayAtk = fa.atk + am.atk;
  const awayDef = fa.def + am.def;
  const meanHome = expectedGoals(homeAtk, awayDef);
  const meanAway = expectedGoals(awayAtk, homeDef);
  return { homeGoals: poisson(meanHome), awayGoals: poisson(meanAway) };
}

// ---------- Estatísticas detalhadas da partida (estilo FootSim) ----------
export type MatchStats = {
  possHome: number; possAway: number;      // posse de bola (%)
  xgHome: number; xgAway: number;          // gols esperados
  shotsHome: number; shotsAway: number;    // finalizações
  onTargetHome: number; onTargetAway: number; // no alvo
  cornersHome: number; cornersAway: number;
  foulsHome: number; foulsAway: number;
  passesHome: number; passesAway: number;
  events: { minute: number; team: "home" | "away"; type: "goal" | "chance" | "shot"; text: string }[];
};

export function matchStats(
  home: SimTeam, away: SimTeam, homeT: Tactics, awayT: Tactics,
  homeGoals: number, awayGoals: number,
  homeScorers: { name: string }[], awayScorers: { name: string }[]
): MatchStats {
  const fh = generalForce(home); const fa = generalForce(away);
  const hm = tacticalMods(homeT); const am = tacticalMods(awayT);
  const hAtk = fh.atk + 5 + hm.atk, aAtk = fa.atk + am.atk;
  const hDef = fh.def + hm.def, aDef = fa.def + am.def;

  // posse: quem tem mais controle de meio + ritmo
  const hControl = fh.atk * 0.6 + fh.def * 0.4 + (homeT.tempo === "rapido" ? 3 : 0);
  const aControl = fa.atk * 0.6 + fa.def * 0.4;
  let possHome = Math.round(50 + (hControl - aControl) * 0.8 + 4); // leve vantagem de casa
  possHome = Math.max(30, Math.min(70, possHome));
  const possAway = 100 - possHome;

  const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  // finalizações proporcionais ao ataque vs defesa + gols
  const shotsHome = Math.max(homeGoals + rnd(1, 4), Math.round(6 + (hAtk - aDef) / 8) + rnd(0, 4));
  const shotsAway = Math.max(awayGoals + rnd(1, 4), Math.round(6 + (aAtk - hDef) / 8) + rnd(0, 4));
  const onTargetHome = Math.min(shotsHome, homeGoals + rnd(1, 3) + Math.round(shotsHome * 0.25));
  const onTargetAway = Math.min(shotsAway, awayGoals + rnd(1, 3) + Math.round(shotsAway * 0.25));
  const xgHome = Math.round((homeGoals * 0.6 + shotsHome * 0.13) * 100) / 100;
  const xgAway = Math.round((awayGoals * 0.6 + shotsAway * 0.13) * 100) / 100;

  const passesHome = Math.round(possHome * (7 + Math.random() * 2));
  const passesAway = Math.round(possAway * (7 + Math.random() * 2));

  // eventos: gols com minuto e marcador + algumas chances
  const events: MatchStats["events"] = [];
  const minutes: number[] = [];
  const totalG = homeGoals + awayGoals;
  for (let i = 0; i < totalG; i++) minutes.push(rnd(1, 90));
  minutes.sort((a, b) => a - b);
  let hi = 0, ai = 0, mi = 0;
  // intercala gols de casa/fora usando os marcadores
  const goalSeq: ("home" | "away")[] = [];
  for (let i = 0; i < homeGoals; i++) goalSeq.push("home");
  for (let i = 0; i < awayGoals; i++) goalSeq.push("away");
  goalSeq.sort(() => Math.random() - 0.5);
  for (const side of goalSeq) {
    const minute = minutes[mi++] ?? rnd(1, 90);
    if (side === "home") {
      const sc = homeScorers[hi++]?.name ?? "Gol";
      events.push({ minute, team: "home", type: "goal", text: `⚽ Gol de ${sc}` });
    } else {
      const sc = awayScorers[ai++]?.name ?? "Gol";
      events.push({ minute, team: "away", type: "goal", text: `⚽ Gol de ${sc}` });
    }
  }
  // algumas chances perdidas
  for (let i = 0; i < rnd(2, 4); i++) {
    const team: "home" | "away" = Math.random() < possHome / 100 ? "home" : "away";
    events.push({ minute: rnd(1, 90), team, type: "chance", text: "Chance perdida" });
  }
  events.sort((a, b) => a.minute - b.minute);

  return {
    possHome, possAway, xgHome, xgAway, shotsHome, shotsAway,
    onTargetHome, onTargetAway,
    cornersHome: rnd(2, 9), cornersAway: rnd(2, 9),
    foulsHome: rnd(6, 16), foulsAway: rnd(6, 16),
    passesHome, passesAway, events,
  };
}

// ---------- Training progression ----------

// Returns stat deltas for a player after a round of training.
export function trainingGain(p: {
  ataque: number; meio: number; defesa: number; idade: number;
  potential: number; position: string; trainingFocus: string;
}, teamFocus: string, intensity: string): { ataque: number; meio: number; defesa: number } {
  const ovr = overall(p);
  const room = p.potential - ovr;
  if (room <= 0 && p.idade > 30) {
    // decline for old players
    if (Math.random() < 0.35) {
      const dec = -1;
      return { ataque: dec, meio: dec, defesa: dec };
    }
    return { ataque: 0, meio: 0, defesa: 0 };
  }
  const intMul = intensity === "intenso" ? 1.5 : intensity === "leve" ? 0.6 : 1;
  const ageMul = p.idade <= 21 ? 1.5 : p.idade <= 25 ? 1.1 : p.idade <= 29 ? 0.6 : 0.25;
  // chance to improve scaled by remaining room
  const chance = Math.min(0.85, (room / 30) * intMul * ageMul);
  const focus = p.trainingFocus !== "auto" ? p.trainingFocus : teamFocus;
  const out = { ataque: 0, meio: 0, defesa: 0 };
  if (Math.random() < chance) {
    const inc = 1;
    if (focus === "ataque") out.ataque = inc;
    else if (focus === "meio") out.meio = inc;
    else if (focus === "defesa") out.defesa = inc;
    else {
      // geral: improve the position's main attribute
      if (["ATA"].includes(p.position)) out.ataque = inc;
      else if (["MEI", "VOL"].includes(p.position)) out.meio = inc;
      else out.defesa = inc;
    }
  }
  return out;
}

export function clampStat(v: number) {
  return Math.max(20, Math.min(99, Math.round(v)));
}

export const MORALE_LABEL = (m: number) =>
  m >= 85 ? "Excelente" : m >= 70 ? "Boa" : m >= 55 ? "Normal" : m >= 40 ? "Baixa" : "Péssima";

export const MORALE_COLOR = (m: number) =>
  m >= 85 ? "text-emerald-400" : m >= 70 ? "text-lime-400" : m >= 55 ? "text-yellow-400" : m >= 40 ? "text-orange-400" : "text-red-400";

