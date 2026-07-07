import { COUNTRY_CONTINENT } from "./currency";

// Competições continentais por continente (nome + qtd de vagas diretas / pré).
export type ContinentalInfo = {
  primary: string;   // competição principal (ex.: Champions, Libertadores)
  primaryColor: string;
  primarySlots: number;
  secondary?: string; // competição secundária (ex.: Europa League, Sul-Americana)
  secondaryColor?: string;
  secondarySlots?: number;
};

// Mapa por continente. Normaliza "América do Sul"/"América" etc.
const CONTINENTAL: Record<string, ContinentalInfo> = {
  Europa: {
    primary: "Champions League", primaryColor: "#3b82f6", primarySlots: 4,
    secondary: "Europa League", secondaryColor: "#f59e0b", secondarySlots: 2,
  },
  "América do Sul": {
    primary: "Libertadores", primaryColor: "#22c55e", primarySlots: 4,
    secondary: "Sul-Americana", secondaryColor: "#38bdf8", secondarySlots: 2,
  },
  "América do Norte": {
    primary: "Concachampions", primaryColor: "#a855f7", primarySlots: 4,
  },
  "América": {
    primary: "Libertadores", primaryColor: "#22c55e", primarySlots: 4,
    secondary: "Sul-Americana", secondaryColor: "#38bdf8", secondarySlots: 2,
  },
  "Ásia": { primary: "AFC Champions", primaryColor: "#ef4444", primarySlots: 3 },
  "África": { primary: "CAF Champions", primaryColor: "#eab308", primarySlots: 3 },
  "Oceania": { primary: "OFC Champions", primaryColor: "#14b8a6", primarySlots: 2 },
};

export function continentalFor(pais?: string): ContinentalInfo | null {
  if (!pais) return null;
  const cont = COUNTRY_CONTINENT[pais];
  if (!cont) return null;
  return CONTINENTAL[cont] ?? null;
}

// Nome do continente pelo país (com fallback)
export function continentOf(pais?: string): string {
  return (pais && COUNTRY_CONTINENT[pais]) || "";
}
