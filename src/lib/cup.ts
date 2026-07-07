// Copa (mata-mata) armazenada como JSON no campo careers.cupData.

export type CupTie = {
  home: number;
  away: number;
  homeGoals: number;
  awayGoals: number;
  penHome?: number;
  penAway?: number;
  played: boolean;
  winner: number | null;
};

export type CupData = {
  name: string;
  rounds: CupTie[][]; // rounds[0] = primeira fase, etc.
  currentRound: number;
  champion: number | null;
  playAt: number[]; // rodada da liga em que cada fase é jogada
};

const FASE_NOMES: Record<number, string> = {
  2: "Final",
  4: "Semifinal",
  8: "Quartas de Final",
  16: "Oitavas de Final",
  32: "Primeira Fase",
};

export function faseNome(numTimes: number): string {
  return FASE_NOMES[numTimes] ?? `Fase de ${numTimes}`;
}

// Monta a copa a partir de uma lista de ids de times.
// opts.maxSize: limita o tamanho da chave (default 16)
// opts.consecutive: se true, joga as fases em rodadas consecutivas (ex.: estadual pré-temporada nas rodadas 1,2,3)
export function buildCup(
  name: string,
  teamIds: number[],
  totalLeagueRounds: number,
  opts?: { maxSize?: number; consecutive?: boolean }
): CupData {
  const maxSize = opts?.maxSize ?? 16;
  const shuffled = [...teamIds].sort(() => Math.random() - 0.5);
  let size = 1;
  while (size * 2 <= shuffled.length && size * 2 <= maxSize) size *= 2;
  const participants = shuffled.slice(0, size);

  const firstRound: CupTie[] = [];
  for (let i = 0; i < participants.length; i += 2) {
    firstRound.push({
      home: participants[i],
      away: participants[i + 1],
      homeGoals: 0,
      awayGoals: 0,
      played: false,
      winner: null,
    });
  }

  const numFases = Math.max(1, Math.log2(size));
  const playAt: number[] = [];
  if (opts?.consecutive) {
    // fases em rodadas consecutivas a partir da 1 (pré-temporada / estadual)
    for (let i = 0; i < numFases; i++) playAt.push(i + 1);
  } else {
    const step = Math.max(1, Math.floor(totalLeagueRounds / (numFases + 1)));
    for (let i = 0; i < numFases; i++) playAt.push(Math.min(totalLeagueRounds, (i + 1) * step));
  }

  return { name, rounds: [firstRound], currentRound: 0, champion: null, playAt };
}

export function cupPlayableNow(cup: CupData, leagueRound: number): boolean {
  if (cup.champion) return false;
  if (cup.currentRound >= cup.playAt.length) return false;
  return leagueRound >= cup.playAt[cup.currentRound];
}

export function currentCupTies(cup: CupData): CupTie[] {
  return cup.rounds[cup.currentRound] ?? [];
}
