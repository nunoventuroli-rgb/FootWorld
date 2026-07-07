import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  timestamp,
  text,
} from "drizzle-orm/pg-core";

export const patches = pgTable("patches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  author: varchar("author", { length: 120 }).notNull().default(""),
  data: text("data").notNull().default("{}"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const careers = pgTable("careers", {
  id: serial("id").primaryKey(),
  coachName: varchar("coach_name", { length: 120 }).notNull(),
  coachPhoto: text("coach_photo").notNull().default(""),
  coachAge: integer("coach_age").notNull().default(45),
  coachNation: varchar("coach_nation", { length: 40 }).notNull().default("Brasil"),
  controlledTeamId: integer("controlled_team_id"),
  season: integer("season").notNull().default(1),
  seasonFormat: varchar("season_format", { length: 12 }).notNull().default("ano"),
  baseYear: integer("base_year").notNull().default(2026),
  leagueName: varchar("league_name", { length: 120 }).notNull().default("Brasileirão Série A"),
  leagueLogo: text("league_logo").notNull().default(""),
  currentRound: integer("current_round").notNull().default(0),
  cupData: text("cup_data").notNull().default(""),
  stateCup: text("state_cup").notNull().default(""),
  trophies: text("trophies").notNull().default("[]"),
  scoutLevel: integer("scout_level").notNull().default(1),
  // expectativa da diretoria: posição-alvo na liga
  boardTarget: integer("board_target").notNull().default(10),
  boardMood: integer("board_mood").notNull().default(70),
  // patrocinador
  sponsorName: varchar("sponsor_name", { length: 80 }).notNull().default(""),
  sponsorPerRound: integer("sponsor_per_round").notNull().default(0),
  sponsorMorale: integer("sponsor_morale").notNull().default(0),
  // moeda de exibição
  currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
  // ids de times já espionados (JSON array)
  scoutedTeams: text("scouted_teams").notNull().default("[]"),
  // seleção nacional que o técnico comanda (país) e estado da Copa do Mundo
  nationalTeam: varchar("national_team", { length: 40 }).notNull().default(""),
  worldCup: text("world_cup").notNull().default(""),
  worldLeagues: text("world_leagues").notNull().default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  careerId: integer("career_id").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  sigla: varchar("sigla", { length: 8 }).notNull(),
  cor1: varchar("cor1", { length: 12 }).notNull().default("#1E88E5"),
  cor2: varchar("cor2", { length: 12 }).notNull().default("#FFFFFF"),
  padrao: varchar("padrao", { length: 24 }).notNull().default("solido"),
  badge: text("badge").notNull().default(""),
  pais: varchar("pais", { length: 40 }).notNull().default(""),
  estadio: varchar("estadio", { length: 80 }).notNull().default(""),
  division: integer("division").notNull().default(1),
  nivel: integer("nivel").notNull().default(70),
  reputation: integer("reputation").notNull().default(3),
  saldo: integer("saldo").notNull().default(20000000),
  formation: varchar("formation", { length: 16 }).notNull().default("4-4-2"),
  // tática avançada
  mentality: varchar("mentality", { length: 16 }).notNull().default("equilibrado"),
  pressing: varchar("pressing", { length: 16 }).notNull().default("medio"),
  tempo: varchar("tempo", { length: 16 }).notNull().default("normal"),
  // treinamento do time
  trainingFocus: varchar("training_focus", { length: 16 }).notNull().default("geral"),
  trainingIntensity: varchar("training_intensity", { length: 16 }).notNull().default("normal"),
  morale: integer("morale").notNull().default(70),
  isControlled: boolean("is_controlled").notNull().default(false),
  pontos: integer("pontos").notNull().default(0),
  jogos: integer("jogos").notNull().default(0),
  vitorias: integer("vitorias").notNull().default(0),
  empates: integer("empates").notNull().default(0),
  derrotas: integer("derrotas").notNull().default(0),
  golsPro: integer("gols_pro").notNull().default(0),
  golsContra: integer("gols_contra").notNull().default(0),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  careerId: integer("career_id").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  photo: text("photo").notNull().default(""),
  position: varchar("position", { length: 8 }).notNull(),
  ataque: integer("ataque").notNull(),
  meio: integer("meio").notNull(),
  defesa: integer("defesa").notNull(),
  idade: integer("idade").notNull(),
  forma: integer("forma").notNull().default(90),
  morale: integer("morale").notNull().default(70),
  potential: integer("potential").notNull().default(75),
  trainingFocus: varchar("training_focus", { length: 16 }).notNull().default("auto"),
  isYouth: boolean("is_youth").notNull().default(false),
  gols: integer("gols").notNull().default(0),
  jogos: integer("jogos").notNull().default(0),
  isStarter: boolean("is_starter").notNull().default(false),
  slotIndex: integer("slot_index").notNull().default(-1),
  transferListed: boolean("transfer_listed").notNull().default(false),
  askingPrice: integer("asking_price").notNull().default(0),
  // assist. da temporada (estatística extra)
  assists: integer("assists").notNull().default(0),
  cleanSheets: integer("clean_sheets").notNull().default(0),
  // empréstimo: id do clube que emprestou (0 = não é empréstimo)
  loanFrom: integer("loan_from").notNull().default(0),
  // adaptação a nova posição: jogos numa posição diferente da natural
  outPosGames: integer("out_pos_games").notNull().default(0),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  careerId: integer("career_id").notNull(),
  round: integer("round").notNull(),
  homeTeamId: integer("home_team_id").notNull(),
  awayTeamId: integer("away_team_id").notNull(),
  homeGoals: integer("home_goals").notNull().default(0),
  awayGoals: integer("away_goals").notNull().default(0),
  played: boolean("played").notNull().default(false),
  scorers: text("scorers").notNull().default(""),
  stats: text("stats").notNull().default(""),
});

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  careerId: integer("career_id").notNull(),
  round: integer("round").notNull().default(0),
  type: varchar("type", { length: 24 }).notNull().default("info"),
  subject: varchar("subject", { length: 200 }).notNull(),
  body: text("body").notNull().default(""),
  read: boolean("read").notNull().default(false),
  // proposta pendente (opcional)
  offerPlayerId: integer("offer_player_id"),
  offerAmount: integer("offer_amount"),
  offerStatus: varchar("offer_status", { length: 16 }).notNull().default("none"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Career = typeof careers.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Patch = typeof patches.$inferSelect;
export type Email = typeof emails.$inferSelect;
