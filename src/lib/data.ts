import { worldLeagues } from "./world";

export type PosKey = "GOL" | "ZAG" | "LAT" | "VOL" | "MEI" | "ATA";

export const POSICOES: PosKey[] = [
  "GOL", "ZAG", "ZAG", "LAT", "LAT", "VOL", "VOL", "MEI", "MEI", "ATA", "ATA",
];

export type TeamDef = {
  name: string;
  sigla: string;
  cor1: string;
  cor2: string;
  padrao: string;
  nivel: number;
  reputation: number;
};

// Fictional Brazilian-style clubs (avoids real trademarks but familiar vibe)
export const TEAMS_DEF: TeamDef[] = [
  { name: "Flaminense", sigla: "FLA", cor1: "#B71C1C", cor2: "#111111", padrao: "listras_horizontais", nivel: 84, reputation: 5 },
  { name: "Palmares FC", sigla: "PAL", cor1: "#1B5E20", cor2: "#FFFFFF", padrao: "solido", nivel: 84, reputation: 5 },
  { name: "Corintia SP", sigla: "COR", cor1: "#111111", cor2: "#FFFFFF", padrao: "solido", nivel: 82, reputation: 5 },
  { name: "São Paulino", sigla: "SAP", cor1: "#C62828", cor2: "#000000", padrao: "listras_horizontais", nivel: 81, reputation: 5 },
  { name: "Atlético Mineiro FC", sigla: "GAL", cor1: "#111111", cor2: "#FFFFFF", padrao: "listras_verticais", nivel: 82, reputation: 5 },
  { name: "Grêmio Sul", sigla: "GRE", cor1: "#0D47A1", cor2: "#111111", padrao: "listras_verticais", nivel: 80, reputation: 4 },
  { name: "Internacional RS", sigla: "INT", cor1: "#C62828", cor2: "#FFFFFF", padrao: "solido", nivel: 80, reputation: 4 },
  { name: "Fluminense da Serra", sigla: "FLU", cor1: "#4A148C", cor2: "#2E7D32", padrao: "listras_verticais", nivel: 79, reputation: 4 },
  { name: "Botafogo Praia", sigla: "BOT", cor1: "#111111", cor2: "#FFFFFF", padrao: "listras_verticais", nivel: 78, reputation: 4 },
  { name: "Vasco do Vale", sigla: "VAS", cor1: "#111111", cor2: "#FFFFFF", padrao: "diagonal", nivel: 76, reputation: 4 },
  { name: "Cruzeiro Azul", sigla: "CRU", cor1: "#1565C0", cor2: "#FFFFFF", padrao: "solido", nivel: 79, reputation: 4 },
  { name: "Athletico Paraná", sigla: "CAP", cor1: "#B71C1C", cor2: "#111111", padrao: "listras_verticais", nivel: 78, reputation: 4 },
  { name: "Bahia Tricolor", sigla: "BAH", cor1: "#1565C0", cor2: "#C62828", padrao: "listras_horizontais", nivel: 74, reputation: 3 },
  { name: "Fortaleza Leão", sigla: "FOR", cor1: "#0D47A1", cor2: "#C62828", padrao: "listras_verticais", nivel: 74, reputation: 3 },
  { name: "Real Litoral", sigla: "RLT", cor1: "#00838F", cor2: "#FFFFFF", padrao: "solido", nivel: 72, reputation: 3 },
  { name: "Estrela do Sul", sigla: "EST", cor1: "#F57C00", cor2: "#111111", padrao: "solido", nivel: 71, reputation: 3 },
  { name: "União Norte", sigla: "UNO", cor1: "#283593", cor2: "#FFEB3B", padrao: "listras_horizontais", nivel: 70, reputation: 3 },
  { name: "Grêmio Águias", sigla: "AGU", cor1: "#5D4037", cor2: "#FFFFFF", padrao: "solido", nivel: 69, reputation: 2 },
  { name: "Central Nordeste", sigla: "CEN", cor1: "#AD1457", cor2: "#FFFFFF", padrao: "diagonal", nivel: 68, reputation: 2 },
  { name: "Red Vale Bragante", sigla: "RVB", cor1: "#C62828", cor2: "#111111", padrao: "solido", nivel: 68, reputation: 2 },
];

// ---------- Patch structures (ligas/copas, times, camisas) ----------

export type PatchPlayerDef = {
  name: string;
  position: PosKey;
  ataque: number;
  meio: number;
  defesa: number;
  idade: number;
  potential: number;
  photo?: string;
};

export type PatchTeamDef = {
  name: string;
  sigla: string;
  cor1: string;
  cor2: string;
  padrao: string;
  nivel: number;
  reputation: number;
  pais?: string;
  estadio?: string;
  saldoM?: number; // orçamento em milhões (€)
  badge?: string; // escudo (imagem base64)
  sponsorName?: string; // patrocinador
  sponsorM?: number; // valor do patrocínio por temporada (milhões €)
  sponsorLogo?: string; // logo do patrocinador (imagem base64)
  players?: PatchPlayerDef[]; // elenco customizado (opcional)
};

export type PatchLeague = {
  name: string;
  type: "liga" | "copa";
  teams: PatchTeamDef[];
  sobe?: number; // vagas de acesso
  desce?: number; // rebaixamento
  divBelow?: number; // índice da liga logo abaixo (divisão inferior). -1 = nenhuma
  pais?: string; // país da liga
  continente?: string; // continente (Europa, América...)
  formatoTemporada?: "ano" | "cruzado"; // ano civil (2026) ou cruzado (26/27)
  preseason?: boolean; // se copa: disputada como torneio de pré-temporada (estadual)
};

// Patrocinador global editável no patch (usado nas ofertas de patrocínio)
export type PatchSponsor = {
  name: string;
  valorM: number; // valor por temporada (milhões €)
  morale: number; // bônus de moral
  logo?: string; // imagem base64
  continente?: string; // opcional: restringe a um continente
};

export type PatchData = {
  leagues: PatchLeague[];
  sponsors?: PatchSponsor[];
};

export const CONTINENTES = ["Europa", "América do Sul", "América do Norte", "Ásia", "África", "Oceania"];
export const FORMATOS_TEMPORADA = [
  { v: "ano", label: "Ano civil (ex: 2026)" },
  { v: "cruzado", label: "Cruzado (ex: 26/27)" },
];

export function defaultPatchData(): PatchData {
  return { leagues: worldLeagues() };
}

export const PADROES = ["solido", "listras_verticais", "listras_horizontais", "diagonal"];

export const PRIMEIRO_NOME = [
  "Gabriel", "Lucas", "Matheus", "Bruno", "Rafael", "Pedro", "João", "Felipe",
  "Diego", "Rodrigo", "Thiago", "Vinícius", "Everton", "Wesley", "Danilo",
  "Léo", "Marcos", "André", "Caio", "Igor", "Renan", "Vitor", "Douglas", "Éder",
];

export const SOBRENOME = [
  "Silva", "Souza", "Costa", "Pereira", "Oliveira", "Santos", "Rodrigues",
  "Almeida", "Nascimento", "Lima", "Araújo", "Ribeiro", "Carvalho", "Gomes",
  "Martins", "Rocha", "Melo", "Barbosa", "Cardoso", "Correia", "Teixeira",
];

export type Formation = {
  name: string;
  // slots in order; each slot maps to a base position and field coordinates (x,y in %)
  slots: { pos: PosKey; x: number; y: number }[];
};

export const FORMATIONS: Record<string, Formation> = {
  "4-4-2": {
    name: "4-4-2",
    slots: [
      { pos: "GOL", x: 50, y: 92 },
      { pos: "LAT", x: 15, y: 72 },
      { pos: "ZAG", x: 38, y: 76 },
      { pos: "ZAG", x: 62, y: 76 },
      { pos: "LAT", x: 85, y: 72 },
      { pos: "MEI", x: 18, y: 48 },
      { pos: "VOL", x: 40, y: 52 },
      { pos: "VOL", x: 60, y: 52 },
      { pos: "MEI", x: 82, y: 48 },
      { pos: "ATA", x: 38, y: 22 },
      { pos: "ATA", x: 62, y: 22 },
    ],
  },
  "4-3-3": {
    name: "4-3-3",
    slots: [
      { pos: "GOL", x: 50, y: 92 },
      { pos: "LAT", x: 15, y: 72 },
      { pos: "ZAG", x: 38, y: 76 },
      { pos: "ZAG", x: 62, y: 76 },
      { pos: "LAT", x: 85, y: 72 },
      { pos: "VOL", x: 50, y: 58 },
      { pos: "MEI", x: 30, y: 46 },
      { pos: "MEI", x: 70, y: 46 },
      { pos: "ATA", x: 18, y: 22 },
      { pos: "ATA", x: 50, y: 18 },
      { pos: "ATA", x: 82, y: 22 },
    ],
  },
  "3-5-2": {
    name: "3-5-2",
    slots: [
      { pos: "GOL", x: 50, y: 92 },
      { pos: "ZAG", x: 28, y: 76 },
      { pos: "ZAG", x: 50, y: 78 },
      { pos: "ZAG", x: 72, y: 76 },
      { pos: "LAT", x: 12, y: 52 },
      { pos: "VOL", x: 38, y: 55 },
      { pos: "MEI", x: 50, y: 45 },
      { pos: "VOL", x: 62, y: 55 },
      { pos: "LAT", x: 88, y: 52 },
      { pos: "ATA", x: 38, y: 22 },
      { pos: "ATA", x: 62, y: 22 },
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    slots: [
      { pos: "GOL", x: 50, y: 92 },
      { pos: "LAT", x: 15, y: 72 },
      { pos: "ZAG", x: 38, y: 76 },
      { pos: "ZAG", x: 62, y: 76 },
      { pos: "LAT", x: 85, y: 72 },
      { pos: "VOL", x: 38, y: 58 },
      { pos: "VOL", x: 62, y: 58 },
      { pos: "MEI", x: 20, y: 38 },
      { pos: "MEI", x: 50, y: 40 },
      { pos: "MEI", x: 80, y: 38 },
      { pos: "ATA", x: 50, y: 18 },
    ],
  },
  "5-3-2": {
    name: "5-3-2",
    slots: [
      { pos: "GOL", x: 50, y: 92 },
      { pos: "LAT", x: 10, y: 68 },
      { pos: "ZAG", x: 32, y: 78 },
      { pos: "ZAG", x: 50, y: 80 },
      { pos: "ZAG", x: 68, y: 78 },
      { pos: "LAT", x: 90, y: 68 },
      { pos: "VOL", x: 32, y: 50 },
      { pos: "MEI", x: 50, y: 46 },
      { pos: "VOL", x: 68, y: 50 },
      { pos: "ATA", x: 38, y: 22 },
      { pos: "ATA", x: 62, y: 22 },
    ],
  },
};

export const FORMATION_KEYS = Object.keys(FORMATIONS);
