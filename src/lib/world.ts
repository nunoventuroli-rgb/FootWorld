import type { PatchLeague, PatchTeamDef } from "./data";

// Clubes fictícios (evitam marcas reais) porém com "vibe" de cada país.
// Times europeus têm nível médio mais alto (mais imersão / dificuldade).

function mk(
  name: string, sigla: string, cor1: string, cor2: string,
  padrao: string, nivel: number, reputation: number
): PatchTeamDef {
  return { name, sigla, cor1, cor2, padrao, nivel, reputation };
}

const BRASIL: PatchTeamDef[] = [
  mk("Flaminense", "FLA", "#B71C1C", "#111111", "listras_horizontais", 84, 5),
  mk("Palmares FC", "PAL", "#1B5E20", "#FFFFFF", "solido", 84, 5),
  mk("Corintia SP", "COR", "#111111", "#FFFFFF", "solido", 82, 5),
  mk("São Paulino", "SAP", "#C62828", "#000000", "listras_horizontais", 81, 5),
  mk("Galo Mineiro", "GAL", "#111111", "#FFFFFF", "listras_verticais", 82, 5),
  mk("Grêmio Sul", "GRE", "#0D47A1", "#111111", "listras_verticais", 80, 4),
  mk("Colorado RS", "INT", "#C62828", "#FFFFFF", "solido", 80, 4),
  mk("Fluminense Serra", "FLU", "#4A148C", "#2E7D32", "listras_verticais", 79, 4),
  mk("Fogão Praia", "BOT", "#111111", "#FFFFFF", "listras_verticais", 78, 4),
  mk("Cruz Azul BH", "CRU", "#1565C0", "#FFFFFF", "solido", 79, 4),
  mk("Bahia Tricolor", "BAH", "#1565C0", "#C62828", "listras_horizontais", 74, 3),
  mk("Fortaleza Leão", "FOR", "#0D47A1", "#C62828", "listras_verticais", 74, 3),
];

const INGLATERRA: PatchTeamDef[] = [
  mk("London Reds", "LDR", "#C8102E", "#FFFFFF", "solido", 88, 5),
  mk("Manchester Blue", "MCB", "#6CABDD", "#FFFFFF", "solido", 89, 5),
  mk("Manchester Red", "MCR", "#DA291C", "#FFFFFF", "solido", 86, 5),
  mk("Mersey FC", "MER", "#C8102E", "#F6EB61", "solido", 87, 5),
  mk("North London", "NLD", "#EF0107", "#FFFFFF", "solido", 85, 5),
  mk("Chelsea Bridge", "CHB", "#034694", "#FFFFFF", "solido", 85, 5),
  mk("Tyne United", "TYN", "#111111", "#FFFFFF", "listras_verticais", 80, 4),
  mk("Villa Park FC", "VIL", "#670E36", "#95BFE5", "solido", 79, 4),
  mk("West Docks", "WSD", "#7A263A", "#1BB1E7", "solido", 78, 4),
  mk("Seaside Town", "SEA", "#DA291C", "#FFFFFF", "solido", 74, 3),
  mk("Cottage FC", "COT", "#111111", "#FFFFFF", "solido", 74, 3),
  mk("Steel City", "STC", "#EE2737", "#FFFFFF", "listras_verticais", 73, 3),
];

const ESPANHA: PatchTeamDef[] = [
  mk("Real Castilla", "RCA", "#FFFFFF", "#FEBE10", "solido", 89, 5),
  mk("Barça Catalunha", "BAR", "#004D98", "#A50044", "listras_verticais", 88, 5),
  mk("Atlético Madri", "ATM", "#CB3524", "#FFFFFF", "listras_verticais", 85, 5),
  mk("Sevilla Sur", "SEV", "#FFFFFF", "#D81E05", "solido", 81, 4),
  mk("Bética Verde", "BET", "#00954C", "#FFFFFF", "listras_verticais", 80, 4),
  mk("Valência Laranja", "VAL", "#FF7A00", "#111111", "solido", 79, 4),
  mk("Bilbao Norte", "BIL", "#EE2523", "#FFFFFF", "listras_verticais", 79, 4),
  mk("Sociedade Basca", "SOC", "#0067B1", "#FFFFFF", "listras_verticais", 78, 4),
  mk("Villarreal Amarelo", "VILL", "#FFE667", "#005187", "solido", 77, 3),
  mk("Girona Vermelho", "GIR", "#C40B2E", "#FFFFFF", "listras_verticais", 76, 3),
  mk("Celta Vigo", "CEL", "#8AC3EE", "#FFFFFF", "solido", 73, 3),
  mk("Getafe Azul", "GET", "#005999", "#FFFFFF", "solido", 72, 3),
];

const ITALIA: PatchTeamDef[] = [
  mk("Juve Torino", "JUV", "#111111", "#FFFFFF", "listras_verticais", 87, 5),
  mk("Milan Rossoneri", "MIL", "#FB090B", "#111111", "listras_verticais", 86, 5),
  mk("Inter Nerazzurri", "INT", "#0068A8", "#111111", "listras_verticais", 87, 5),
  mk("Napoli Sul", "NAP", "#12A0D7", "#FFFFFF", "solido", 85, 5),
  mk("Roma Loba", "ROM", "#8E1F2F", "#F0BC42", "solido", 83, 4),
  mk("Lazio Aquila", "LAZ", "#87D8F7", "#FFFFFF", "solido", 81, 4),
  mk("Atalanta Bergamo", "ATA", "#1E71B8", "#111111", "listras_verticais", 82, 4),
  mk("Fiorentina Viola", "FIO", "#592C82", "#FFFFFF", "solido", 79, 4),
  mk("Torino Granata", "TOR", "#881600", "#FFFFFF", "solido", 76, 3),
  mk("Bologna Rosso", "BOL", "#1A2F48", "#A81C22", "listras_verticais", 76, 3),
  mk("Génova Grifo", "GEN", "#C8102E", "#003B7B", "listras_verticais", 73, 3),
  mk("Udine Bianco", "UDI", "#111111", "#FFFFFF", "listras_verticais", 72, 3),
];

const ALEMANHA: PatchTeamDef[] = [
  mk("Bayern Sul", "BAY", "#DC052D", "#FFFFFF", "solido", 89, 5),
  mk("Dortmund Amarelo", "DOR", "#FDE100", "#111111", "solido", 85, 5),
  mk("Leipzig RB", "LPZ", "#DD0741", "#FFFFFF", "solido", 83, 4),
  mk("Leverkusen Aspirina", "LEV", "#E32221", "#111111", "solido", 84, 5),
  mk("Frankfurt Águia", "FRA", "#111111", "#E1000F", "solido", 80, 4),
  mk("Stuttgart FC", "STU", "#FFFFFF", "#E32219", "solido", 79, 4),
  mk("Bremen Verde", "BRE", "#1D9053", "#FFFFFF", "solido", 77, 3),
  mk("Wolfsburgo", "WOL", "#65B32E", "#FFFFFF", "solido", 77, 3),
  mk("Mönchen Potros", "GLA", "#111111", "#FFFFFF", "solido", 75, 3),
  mk("Freiburg Floresta", "FRE", "#E1000F", "#111111", "solido", 74, 3),
  mk("Mainz 05", "MAI", "#C3141E", "#FFFFFF", "solido", 72, 3),
  mk("Hoffenheim Azul", "HOF", "#1C63B7", "#FFFFFF", "solido", 72, 3),
];

const FRANCA: PatchTeamDef[] = [
  mk("Paris Capital", "PAR", "#004170", "#DA291C", "solido", 88, 5),
  mk("Marselha Sul", "MAR", "#2FAEE0", "#FFFFFF", "solido", 82, 4),
  mk("Lyon Olímpico", "LYO", "#FFFFFF", "#DA001A", "solido", 81, 4),
  mk("Mônaco Principado", "MON", "#E51B22", "#FFFFFF", "diagonal", 82, 4),
  mk("Lille Norte", "LIL", "#E01E13", "#111133", "solido", 80, 4),
  mk("Nice Riviera", "NIC", "#111111", "#DA291C", "solido", 78, 4),
  mk("Rennes Bretão", "REN", "#111111", "#E23237", "listras_verticais", 77, 3),
  mk("Lens Sangue-Ouro", "LEN", "#FFEC00", "#E2001A", "listras_verticais", 77, 3),
  mk("Nantes Canário", "NAN", "#FDE100", "#008D36", "solido", 74, 3),
  mk("Estrasburgo Azul", "STR", "#009EE0", "#FFFFFF", "solido", 73, 3),
  mk("Montpellier", "MTP", "#F47C20", "#0B1E5B", "solido", 72, 3),
  mk("Brest Atlântico", "BRE", "#E2001A", "#FFFFFF", "solido", 71, 3),
];

const ARGENTINA: PatchTeamDef[] = [
  mk("River Norte", "RIV", "#FFFFFF", "#E2001A", "diagonal", 82, 5),
  mk("Boca Sur", "BOC", "#004B87", "#FDB913", "listras_horizontais", 82, 5),
  mk("Racing AR", "RAC", "#7EC6E8", "#FFFFFF", "listras_verticais", 79, 4),
  mk("Independiente AR", "IND", "#E2001A", "#FFFFFF", "solido", 78, 4),
  mk("San Lorenzo AR", "SLO", "#153886", "#B01E2E", "listras_verticais", 77, 4),
  mk("Estudiantes LP", "EST", "#E2001A", "#FFFFFF", "listras_horizontais", 76, 3),
  mk("Vélez Oeste", "VEL", "#FFFFFF", "#003C7D", "solido", 75, 3),
  mk("Rosario Central", "ROS", "#0B3D91", "#FDB913", "solido", 74, 3),
  mk("Newell's Velha", "NEW", "#E2001A", "#111111", "listras_verticais", 74, 3),
  mk("Talleres Córdoba", "TAL", "#005CA9", "#FFFFFF", "solido", 72, 3),
];

const PORTUGAL: PatchTeamDef[] = [
  mk("Benfica Lisboa", "BEN", "#E20613", "#FFFFFF", "solido", 83, 5),
  mk("Porto Dragão", "POR", "#004C99", "#FFFFFF", "solido", 83, 5),
  mk("Sporting Leão", "SPO", "#008057", "#FFFFFF", "listras_horizontais", 82, 5),
  mk("Braga Minho", "BRA", "#E30613", "#FFFFFF", "solido", 79, 4),
  mk("Vitória SC", "VIT", "#FFFFFF", "#111111", "solido", 74, 3),
  mk("Boavista FC", "BOA", "#111111", "#FFFFFF", "listras_horizontais", 73, 3),
  mk("Marítimo Ilha", "MAR", "#009543", "#E30613", "listras_verticais", 71, 3),
  mk("Rio Ave", "RAV", "#009543", "#FFFFFF", "solido", 70, 2),
  mk("Famalicão", "FAM", "#005BAC", "#FFFFFF", "solido", 70, 2),
  mk("Estoril Praia", "EST", "#FDB913", "#005BAC", "solido", 69, 2),
];

// Série B brasileira (nível mais baixo — divisão inferior)
const BRASIL_B: PatchTeamDef[] = [
  mk("Ponte Verde", "PON", "#111111", "#2E7D32", "listras_horizontais", 68, 3),
  mk("Guarani Bugre", "GUA", "#1565C0", "#FFFFFF", "solido", 67, 3),
  mk("Náutico Recife", "NAU", "#C62828", "#FFFFFF", "listras_verticais", 66, 3),
  mk("Sport Ilha", "SPT", "#B71C1C", "#111111", "listras_horizontais", 67, 3),
  mk("Vila Nova GO", "VIL", "#E53935", "#111111", "solido", 65, 2),
  mk("Goiás Verdão", "GOI", "#1B5E20", "#FFFFFF", "solido", 66, 2),
  mk("Ceará Vozão", "CEA", "#111111", "#FFFFFF", "listras_horizontais", 66, 2),
  mk("Avaí Leão", "AVA", "#0D47A1", "#FFFFFF", "listras_horizontais", 64, 2),
  mk("Chapecó Verde", "CHA", "#1B5E20", "#FFFFFF", "solido", 63, 2),
  mk("Paraná Tricolor", "PAR", "#C62828", "#0D47A1", "listras_verticais", 63, 2),
  mk("América Coelho", "AME", "#111111", "#4CAF50", "solido", 64, 2),
  mk("Coritiba Coxa", "CRB", "#00838F", "#FFFFFF", "listras_verticais", 65, 2),
];

const HOLANDA: PatchTeamDef[] = [
  mk("Ajax Amsterdã", "AJA", "#D2122E", "#FFFFFF", "listras_verticais", 80, 4),
  mk("PSV Luz", "PSV", "#E4002B", "#FFFFFF", "solido", 80, 4),
  mk("Feyenoord Porto", "FEY", "#E30613", "#111111", "listras_horizontais", 79, 4),
  mk("AZ Alkmaar", "AZ", "#E4002B", "#FFFFFF", "solido", 74, 3),
  mk("Twente Enschede", "TWE", "#E4002B", "#FFFFFF", "solido", 72, 3),
  mk("Utrecht FC", "UTR", "#C8102E", "#FFFFFF", "solido", 70, 3),
];

const URUGUAI: PatchTeamDef[] = [
  mk("Nacional Bolso", "NAC", "#FFFFFF", "#0038A8", "solido", 74, 4),
  mk("Peñarol Aurinegro", "PEN", "#FDB913", "#111111", "listras_verticais", 74, 4),
  mk("Defensor Sporting", "DEF", "#5B2A86", "#FFFFFF", "solido", 68, 3),
  mk("Danubio FC", "DAN", "#0038A8", "#FFFFFF", "solido", 66, 2),
  mk("Liverpool Monte", "LIV", "#111111", "#005BAC", "solido", 66, 2),
  mk("Wanderers Bohemio", "WAN", "#111111", "#E4002B", "listras_verticais", 64, 2),
];

const MEXICO: PatchTeamDef[] = [
  mk("América Águias", "AME", "#FFD100", "#005BAC", "solido", 76, 4),
  mk("Chivas Guadalajara", "CHI", "#E4002B", "#FFFFFF", "listras_verticais", 75, 4),
  mk("Cruz Azul MX", "CAZ", "#005BAC", "#FFFFFF", "solido", 74, 3),
  mk("Tigres UANL", "TIG", "#FDB913", "#005BAC", "solido", 75, 4),
  mk("Monterrey Rayados", "MTY", "#005BAC", "#FFFFFF", "listras_verticais", 74, 3),
  mk("Pumas UNAM", "PUM", "#FDB913", "#005BAC", "solido", 70, 3),
];

const BELGICA: PatchTeamDef[] = [
  mk("Bruges Azul", "BRG", "#005BAC", "#111111", "listras_verticais", 76, 4),
  mk("Anderlecht Roxo", "AND", "#5B2A86", "#FFFFFF", "solido", 75, 4),
  mk("Gent Búfalos", "GEN", "#005BAC", "#FFFFFF", "listras_verticais", 72, 3),
  mk("Antuérpia FC", "ANT", "#E4002B", "#FFFFFF", "solido", 71, 3),
  mk("Genk Azul", "GNK", "#005BAC", "#FFFFFF", "solido", 71, 3),
  mk("Standard Liège", "STA", "#E4002B", "#111111", "listras_verticais", 69, 2),
];
const COLOMBIA: PatchTeamDef[] = [
  mk("Nacional Verde", "NAC", "#1B5E20", "#FFFFFF", "solido", 72, 4),
  mk("Millonarios Azul", "MIL", "#0038A8", "#FFFFFF", "solido", 71, 3),
  mk("América Cali", "AME", "#E4002B", "#FFFFFF", "solido", 70, 3),
  mk("Junior Barranquilla", "JUN", "#E4002B", "#FFFFFF", "listras_verticais", 70, 3),
  mk("Cali Verde", "CAL", "#1B5E20", "#FFFFFF", "solido", 68, 2),
  mk("Santa Fe Cardenal", "SFE", "#B71C1C", "#FFFFFF", "solido", 67, 2),
];
const CROACIA: PatchTeamDef[] = [
  mk("Dínamo Zagreb", "DIN", "#005BAC", "#FFFFFF", "solido", 74, 4),
  mk("Hajduk Split", "HAJ", "#FFFFFF", "#005BAC", "solido", 72, 3),
  mk("Rijeka Branca", "RIJ", "#FFFFFF", "#B71C1C", "solido", 69, 3),
  mk("Osijek Bijelo", "OSI", "#005BAC", "#FFFFFF", "solido", 66, 2),
  mk("Lokomotiva ZG", "LOK", "#1B5E20", "#FFFFFF", "solido", 64, 2),
  mk("Gorica FC", "GOR", "#F57C00", "#111111", "solido", 63, 2),
];

function withCountry(list: PatchTeamDef[], pais: string): PatchTeamDef[] {
  return list.map((t) => ({ ...t, pais }));
}

export function worldLeagues(): PatchLeague[] {
  // formato "ano" = América (calendário no ano civil), "cruzado" = Europa (26/27)
  return [
    // Brasil com 2 divisões ligadas (Série A ⇄ Série B) — América do Sul, ano civil
    { name: "Brasileirão Série A", type: "liga", teams: withCountry(BRASIL, "Brasil"), sobe: 0, desce: 2, divBelow: 1, pais: "Brasil", continente: "América do Sul", formatoTemporada: "ano" },
    { name: "Brasileirão Série B", type: "liga", teams: withCountry(BRASIL_B, "Brasil"), sobe: 2, desce: 0, pais: "Brasil", continente: "América do Sul", formatoTemporada: "ano" },
    { name: "Premier Inglesa", type: "liga", teams: withCountry(INGLATERRA, "Inglaterra"), pais: "Inglaterra", continente: "Europa", formatoTemporada: "cruzado" },
    { name: "La Liga Espanhola", type: "liga", teams: withCountry(ESPANHA, "Espanha"), pais: "Espanha", continente: "Europa", formatoTemporada: "cruzado" },
    { name: "Serie A Italiana", type: "liga", teams: withCountry(ITALIA, "Itália"), pais: "Itália", continente: "Europa", formatoTemporada: "cruzado" },
    { name: "Bundesliga Alemã", type: "liga", teams: withCountry(ALEMANHA, "Alemanha"), pais: "Alemanha", continente: "Europa", formatoTemporada: "cruzado" },
    { name: "Ligue 1 Francesa", type: "liga", teams: withCountry(FRANCA, "França"), pais: "França", continente: "Europa", formatoTemporada: "cruzado" },
    { name: "Liga Argentina", type: "liga", teams: withCountry(ARGENTINA, "Argentina"), pais: "Argentina", continente: "América do Sul", formatoTemporada: "ano" },
    { name: "Liga Portuguesa", type: "liga", teams: withCountry(PORTUGAL, "Portugal"), pais: "Portugal", continente: "Europa", formatoTemporada: "cruzado" },
    { name: "Eredivisie Holandesa", type: "liga", teams: withCountry(HOLANDA, "Holanda"), pais: "Holanda", continente: "Europa", formatoTemporada: "cruzado" },
    { name: "Liga Uruguaia", type: "liga", teams: withCountry(URUGUAI, "Uruguai"), pais: "Uruguai", continente: "América do Sul", formatoTemporada: "ano" },
    { name: "Liga MX Mexicana", type: "liga", teams: withCountry(MEXICO, "México"), pais: "México", continente: "América do Norte", formatoTemporada: "ano" },
    { name: "Liga Belga", type: "liga", teams: withCountry(BELGICA, "Bélgica"), pais: "Bélgica", continente: "Europa", formatoTemporada: "cruzado" },
    { name: "Liga Colombiana", type: "liga", teams: withCountry(COLOMBIA, "Colômbia"), pais: "Colômbia", continente: "América do Sul", formatoTemporada: "ano" },
    { name: "Liga Croata", type: "liga", teams: withCountry(CROACIA, "Croácia"), pais: "Croácia", continente: "Europa", formatoTemporada: "cruzado" },
  ];
}
