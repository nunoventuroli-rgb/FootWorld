import { db } from "@/db";
import { careers, teams, players, matches, emails } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildCalendar } from "@/lib/engine";
import { buildCup } from "@/lib/cup";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const careerId = Number(id);
  const [career] = await db.select().from(careers).where(eq(careers.id, careerId));
  if (!career) return Response.json({ error: "not found" }, { status: 404 });

  const allTeams = await db.select().from(teams).where(eq(teams.careerId, careerId));
  const allPlayers = await db.select().from(players).where(eq(players.careerId, careerId));
  const realTeams = allTeams.filter((t) => t.id > 0);

  const sortTable = (arr: typeof realTeams) => [...arr].sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    if (b.golsPro - b.golsContra !== a.golsPro - a.golsContra) return (b.golsPro - b.golsContra) - (a.golsPro - a.golsContra);
    return b.golsPro - a.golsPro;
  });

  const divisions = Array.from(new Set(realTeams.map((t) => t.division))).filter((d) => d < 90).sort((a, b) => a - b);
  const controlled = allTeams.find((t) => t.id === career.controlledTeamId);
  const myDiv = controlled?.division ?? 1;
  const myTable = sortTable(realTeams.filter((t) => t.division === myDiv));
  const finalPos = controlled ? myTable.findIndex((t) => t.id === controlled.id) + 1 : 0;

  // registra troféu da LIGA se você foi campeão da sua divisão
  let trophies: { name: string; season: number; type: string }[] = [];
  try { trophies = JSON.parse(career.trophies || "[]"); } catch { trophies = []; }
  if (finalPos === 1 && controlled) {
    const divTrophy = myDiv === 1 ? career.leagueName : `${career.leagueName} (Divisão ${myDiv})`;
    trophies.push({ name: divTrophy, season: career.season, type: "liga" });
  }

  // ---- Acesso e rebaixamento entre divisões (2 sobem / 2 descem) ----
  const promoRele: string[] = [];
  const SWAP = 2;
  for (let i = 0; i < divisions.length - 1; i++) {
    const upperDiv = divisions[i];
    const lowerDiv = divisions[i + 1];
    const upper = sortTable(realTeams.filter((t) => t.division === upperDiv));
    const lower = sortTable(realTeams.filter((t) => t.division === lowerDiv));
    const nSwap = Math.min(SWAP, upper.length - 1, lower.length - 1);
    if (nSwap <= 0) continue;
    const relegated = upper.slice(upper.length - nSwap); // últimos da de cima
    const promoted = lower.slice(0, nSwap); // primeiros da de baixo
    for (const t of relegated) {
      await db.update(teams).set({ division: lowerDiv }).where(eq(teams.id, t.id));
      t.division = lowerDiv;
    }
    for (const t of promoted) {
      await db.update(teams).set({ division: upperDiv }).where(eq(teams.id, t.id));
      t.division = upperDiv;
    }
    promoRele.push(`Divisão ${upperDiv}: subiram ${promoted.map((t) => t.name).join(", ")}; caíram ${relegated.map((t) => t.name).join(", ")}.`);
  }

  // avaliação da diretoria
  let boardMood = career.boardMood;
  let boardMsg = "";
  if (finalPos > 0) {
    if (finalPos <= career.boardTarget) {
      boardMood = Math.min(100, boardMood + 20);
      boardMsg = `Excelente temporada! Você terminou em ${finalPos}º, cumprindo a meta (Top ${career.boardTarget}). A diretoria está muito satisfeita.`;
    } else if (finalPos <= career.boardTarget + 3) {
      boardMood = Math.max(0, boardMood - 5);
      boardMsg = `Você terminou em ${finalPos}º, um pouco abaixo da meta (Top ${career.boardTarget}). A diretoria espera mais na próxima.`;
    } else {
      boardMood = Math.max(0, boardMood - 25);
      boardMsg = `Temporada decepcionante: ${finalPos}º, longe da meta (Top ${career.boardTarget}). A diretoria está insatisfeita — melhore ou seu emprego corre risco.`;
    }
  }

  // devolve empréstimos aos donos
  for (const p of allPlayers) {
    if (p.loanFrom && p.loanFrom > 0) {
      const owns = allTeams.some((t) => t.id === p.loanFrom);
      await db.update(players).set({ teamId: owns ? p.loanFrom : 0, loanFrom: 0, isStarter: false, slotIndex: -1 }).where(eq(players.id, p.id));
    }
  }

  // envelhece jogadores e zera stats da temporada; aposenta muito velhos
  for (const p of allPlayers) {
    const newAge = p.idade + 1;
    if (newAge > 38 && p.teamId > 0) {
      // aposentadoria: vira agente livre "sumindo" (remove)
      await db.delete(players).where(eq(players.id, p.id));
      continue;
    }
    await db.update(players).set({
      idade: newAge,
      gols: 0, assists: 0, cleanSheets: 0, jogos: 0,
    }).where(eq(players.id, p.id));
  }

  // zera classificação dos times e receita do patrocínio anual
  for (const t of realTeams) {
    await db.update(teams).set({
      pontos: 0, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, golsPro: 0, golsContra: 0,
    }).where(eq(teams.id, t.id));
  }

  // recria calendário para TODAS as divisões (nacionais + mundo) e copa
  await db.delete(matches).where(eq(matches.careerId, careerId));
  const rows: { careerId: number; round: number; homeTeamId: number; awayTeamId: number }[] = [];
  let totalRounds = 0;
  const allDivs = Array.from(new Set(realTeams.map((t) => t.division))).sort((a, b) => a - b);
  for (const div of allDivs) {
    const ids = realTeams.filter((t) => t.division === div).map((t) => t.id);
    if (ids.length < 2) continue;
    const cal = buildCalendar(ids);
    for (const g of cal) rows.push({ careerId, round: g.round, homeTeamId: g.home, awayTeamId: g.away });
    if (div === myDiv) totalRounds = cal.reduce((m, g) => Math.max(m, g.round), 0);
  }
  if (rows.length) await db.insert(matches).values(rows);
  const cupTeams = realTeams.filter((t) => t.division === 1).map((t) => t.id);
  const cup = buildCup(`Copa ${career.leagueName}`, cupTeams.length >= 4 ? cupTeams : realTeams.map((t) => t.id), totalRounds);

  // recria o estadual pré-temporada
  const paisNome = controlled?.pais || "Estadual";
  const estadualTeams = realTeams.filter((t) => (t.division === 1 || t.division === 2) && t.pais === controlled?.pais).map((t) => t.id);
  const stateCup = estadualTeams.length >= 4
    ? buildCup(`Estadual ${paisNome}`, estadualTeams, totalRounds, { maxSize: 8, consecutive: true })
    : null;

  const newSeason = career.season + 1;
  await db.update(careers).set({
    season: newSeason,
    currentRound: 0,
    cupData: JSON.stringify(cup),
    stateCup: stateCup ? JSON.stringify(stateCup) : "",
    trophies: JSON.stringify(trophies),
    boardMood,
    updatedAt: new Date(),
  }).where(eq(careers.id, careerId));

  // e-mail da diretoria
  if (boardMsg) {
    await db.insert(emails).values({
      careerId, round: 0, type: "board",
      subject: `Avaliação da diretoria — Temporada ${career.season}`,
      body: boardMsg,
    });
  }
  await db.insert(emails).values({
    careerId, round: 0, type: "info",
    subject: `Temporada ${newSeason} começando!`,
    body: "Nova temporada! Reveja seu elenco, táticas e o mercado de transferências.",
  });
  if (promoRele.length) {
    await db.insert(emails).values({
      careerId, round: 0, type: "info",
      subject: "Acesso e Rebaixamento",
      body: promoRele.join("\n"),
    });
  }

  return Response.json({ ok: true, season: newSeason });
}
