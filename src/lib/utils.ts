import { TeamT, PlayerT } from "./types";

export function saldoGols(t: TeamT) {
  return t.golsPro - t.golsContra;
}

export function standings(teams: TeamT[]): TeamT[] {
  return [...teams].sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    if (saldoGols(b) !== saldoGols(a)) return saldoGols(b) - saldoGols(a);
    return b.golsPro - a.golsPro;
  });
}

export const POS_ORDER: Record<string, number> = {
  GOL: 0, ZAG: 1, LAT: 2, VOL: 3, MEI: 4, ATA: 5,
};

export function sortByPos(players: PlayerT[]): PlayerT[] {
  return [...players].sort((a, b) => (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9));
}

export const POS_COLOR: Record<string, string> = {
  GOL: "bg-amber-500/20 text-amber-300",
  ZAG: "bg-sky-500/20 text-sky-300",
  LAT: "bg-cyan-500/20 text-cyan-300",
  VOL: "bg-teal-500/20 text-teal-300",
  MEI: "bg-emerald-500/20 text-emerald-300",
  ATA: "bg-rose-500/20 text-rose-300",
};

export function ovrColor(ovr: number): string {
  if (ovr >= 85) return "text-emerald-400";
  if (ovr >= 78) return "text-lime-400";
  if (ovr >= 70) return "text-yellow-400";
  if (ovr >= 62) return "text-orange-400";
  return "text-red-400";
}
