import { PlayerT } from "./types";

// Atributos detalhados estilo FIFA, derivados de forma DETERMINÍSTICA
// dos 3 stats base (ataque/meio/defesa) + posição + id do jogador.
// Assim não precisamos de novas colunas no banco e cada jogador tem
// um "perfil" consistente (não muda a cada render).

export type FifaAttr = {
  ritmo: number;      // PAC
  finalizacao: number;// SHO
  passe: number;      // PAS
  drible: number;     // DRI
  defesa: number;     // DEF
  fisico: number;     // PHY
};

export const ATTR_LABELS: { key: keyof FifaAttr; label: string; short: string }[] = [
  { key: "ritmo", label: "Ritmo", short: "RIT" },
  { key: "finalizacao", label: "Finalização", short: "FIN" },
  { key: "passe", label: "Passe", short: "PAS" },
  { key: "drible", label: "Drible", short: "DRI" },
  { key: "defesa", label: "Defesa", short: "DEF" },
  { key: "fisico", label: "Físico", short: "FÍS" },
];

// gera um "ruído" estável entre -6 e +6 a partir do id e um sal
function jitter(id: number, salt: number): number {
  const x = Math.sin(id * 12.9898 + salt * 78.233) * 43758.5453;
  const frac = x - Math.floor(x);
  return Math.round((frac - 0.5) * 12); // ~ -6..+6
}

const clamp = (v: number) => Math.max(20, Math.min(99, Math.round(v)));

export function fifaAttrs(p: Pick<PlayerT, "id" | "position" | "ataque" | "meio" | "defesa" | "idade">): FifaAttr {
  const { id, position, ataque: atk, meio: mid, defesa: def, idade } = p;
  // ritmo cai com a idade
  const ageFactor = idade >= 32 ? -6 : idade >= 29 ? -3 : idade <= 21 ? 3 : 0;

  if (position === "GOL") {
    // goleiro: quase tudo baseado em "defesa" (reflexos)
    return {
      ritmo: clamp(def - 15 + jitter(id, 1)),
      finalizacao: clamp(def - 45 + jitter(id, 2)),
      passe: clamp(def - 20 + jitter(id, 3)),
      drible: clamp(def - 40 + jitter(id, 4)),
      defesa: clamp(def + jitter(id, 5)),
      fisico: clamp(def - 8 + jitter(id, 6)),
    };
  }

  const base: FifaAttr = {
    ritmo: (atk * 0.5 + mid * 0.3 + def * 0.2) + ageFactor,
    finalizacao: (atk * 0.75 + mid * 0.2 + def * 0.05),
    passe: (mid * 0.7 + atk * 0.2 + def * 0.1),
    drible: (atk * 0.5 + mid * 0.45 + def * 0.05),
    defesa: (def * 0.8 + mid * 0.2),
    fisico: (def * 0.4 + atk * 0.25 + mid * 0.35),
  };

  // pequenos ajustes por posição
  if (position === "ATA") { base.finalizacao += 6; base.ritmo += 3; base.defesa -= 8; }
  else if (position === "MEI") { base.passe += 5; base.drible += 4; base.defesa -= 4; }
  else if (position === "VOL") { base.defesa += 4; base.fisico += 4; base.finalizacao -= 6; }
  else if (position === "LAT") { base.ritmo += 5; base.defesa += 2; base.finalizacao -= 6; }
  else if (position === "ZAG") { base.defesa += 6; base.fisico += 4; base.finalizacao -= 10; base.ritmo -= 2; }

  return {
    ritmo: clamp(base.ritmo + jitter(id, 1)),
    finalizacao: clamp(base.finalizacao + jitter(id, 2)),
    passe: clamp(base.passe + jitter(id, 3)),
    drible: clamp(base.drible + jitter(id, 4)),
    defesa: clamp(base.defesa + jitter(id, 5)),
    fisico: clamp(base.fisico + jitter(id, 6)),
  };
}

export function attrColor(v: number): string {
  if (v >= 85) return "text-emerald-400";
  if (v >= 75) return "text-lime-400";
  if (v >= 65) return "text-yellow-400";
  if (v >= 55) return "text-orange-400";
  return "text-red-400";
}

export function attrBarColor(v: number): string {
  if (v >= 85) return "bg-emerald-400";
  if (v >= 75) return "bg-lime-400";
  if (v >= 65) return "bg-yellow-400";
  if (v >= 55) return "bg-orange-400";
  return "bg-red-400";
}
