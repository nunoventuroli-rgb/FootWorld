import { db } from "@/db";
import { careers, teams, players, matches, emails } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const careerId = Number(id);
  const [career] = await db.select().from(careers).where(eq(careers.id, careerId));
  if (!career) return Response.json({ error: "not found" }, { status: 404 });

  const allTeams = await db.select().from(teams).where(eq(teams.careerId, careerId));
  const allPlayers = await db.select().from(players).where(eq(players.careerId, careerId));
  const allMatches = await db.select().from(matches).where(eq(matches.careerId, careerId));

  const allEmails = await db.select().from(emails).where(eq(emails.careerId, careerId));
  allEmails.sort((a, b) => b.id - a.id);

  // totalRounds = número de rodadas da divisão do time do jogador (não do mundo inteiro)
  const myTeam = allTeams.find((t) => t.id === career.controlledTeamId);
  const myDivMatches = myTeam ? allMatches.filter((m) => {
    const h = allTeams.find((t) => t.id === m.homeTeamId);
    return h && h.division === myTeam.division;
  }) : allMatches;
  const totalRounds = myDivMatches.reduce((m, x) => Math.max(m, x.round), 0);

  return Response.json({
    career,
    teams: allTeams,
    players: allPlayers,
    matches: allMatches,
    emails: allEmails,
    totalRounds,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const careerId = Number(id);
  await db.delete(emails).where(eq(emails.careerId, careerId));
  await db.delete(matches).where(eq(matches.careerId, careerId));
  await db.delete(players).where(eq(players.careerId, careerId));
  await db.delete(teams).where(eq(teams.careerId, careerId));
  await db.delete(careers).where(eq(careers.id, careerId));
  return Response.json({ ok: true });
}
