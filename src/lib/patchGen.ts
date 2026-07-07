import { PatchPlayerDef, PosKey, PRIMEIRO_NOME, SOBRENOME } from "./data";

// Geração de elenco para o EDITOR (client-side), independente do engine do servidor.
// Cria 18 jogadores coerentes com um nível-base.

const DIST: PosKey[] = [
  "GOL", "GOL",
  "ZAG", "ZAG", "ZAG", "ZAG",
  "LAT", "LAT", "LAT",
  "VOL", "VOL", "MEI", "MEI",
  "MEI", "ATA", "ATA", "ATA", "ATA",
];

function clamp(v: number, lo = 30, hi = 99) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}
function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export function genPatchPlayer(position: PosKey, nivel: number): PatchPlayerDef {
  const v = ri(-8, 8);
  let ataque: number, meio: number, defesa: number;
  switch (position) {
    case "ATA": ataque = nivel + v; meio = nivel - 10; defesa = nivel - 25; break;
    case "MEI": ataque = nivel - 8; meio = nivel + v; defesa = nivel - 12; break;
    case "VOL": ataque = nivel - 18; meio = nivel + v; defesa = nivel - 2; break;
    case "ZAG":
    case "LAT": ataque = nivel - 22; meio = nivel - 10; defesa = nivel + v; break;
    default: ataque = nivel - 40; meio = nivel - 30; defesa = nivel + v;
  }
  const idade = ri(18, 33);
  const base = Math.round((clamp(ataque) + clamp(meio) + clamp(defesa)) / 3);
  const growth = idade <= 21 ? ri(6, 18) : idade <= 25 ? ri(2, 8) : ri(0, 3);
  return {
    name: `${pick(PRIMEIRO_NOME)} ${pick(SOBRENOME)}`,
    position,
    ataque: clamp(ataque),
    meio: clamp(meio),
    defesa: clamp(defesa),
    idade,
    potential: clamp(base + growth),
  };
}

export function genPatchSquad(nivel: number): PatchPlayerDef[] {
  return DIST.map((pos) => genPatchPlayer(pos, nivel + ri(-5, 5)));
}

export function patchPlayerOverall(p: PatchPlayerDef): number {
  const { ataque, meio, defesa, position } = p;
  switch (position) {
    case "ATA": return Math.round(ataque * 0.6 + meio * 0.3 + defesa * 0.1);
    case "MEI": return Math.round(ataque * 0.35 + meio * 0.5 + defesa * 0.15);
    case "VOL": return Math.round(ataque * 0.15 + meio * 0.45 + defesa * 0.4);
    case "ZAG":
    case "LAT": return Math.round(ataque * 0.1 + meio * 0.25 + defesa * 0.65);
    case "GOL": return Math.round(defesa);
    default: return Math.round((ataque + meio + defesa) / 3);
  }
}
