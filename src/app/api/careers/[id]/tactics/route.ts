import { db } from "@/db";
import { teams, players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { slotsForFormation } from "@/lib/engine";
import { autoPickStarters } from "@/lib/roster";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const careerId = Number(id);
  const body = await req.json().catch(() => ({}));
  const teamId = Number(body.teamId);
  const formation: string = body.formation || "4-4-2";
  const startersInput: number[] | undefined = Array.isArray(body.starters)
    ? body.starters.map((x: unknown) => Number(x))
    : undefined;

  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team || team.careerId !== careerId) {
    return Response.json({ error: "invalid team" }, { status: 400 });
  }

  const squad = await db.select().from(players).where(eq(players.teamId, teamId));
  const slots = slotsForFormation(formation);

  // tactical settings
  const tacticUpdate: Record<string, string> = { formation };
  if (typeof body.mentality === "string") tacticUpdate.mentality = body.mentality;
  if (typeof body.pressing === "string") tacticUpdate.pressing = body.pressing;
  if (typeof body.tempo === "string") tacticUpdate.tempo = body.tempo;

  // reset
  await db.update(teams).set(tacticUpdate).where(eq(teams.id, teamId));
  for (const p of squad) {
    if (p.isStarter || p.slotIndex !== -1) {
      await db.update(players).set({ isStarter: false, slotIndex: -1 }).where(eq(players.id, p.id));
    }
  }

  let assignment: Map<number, number>;
  if (startersInput && startersInput.length === slots.length) {
    assignment = new Map();
    startersInput.forEach((pid, idx) => {
      if (squad.some((p) => p.id === pid)) assignment.set(pid, idx);
    });
  } else {
    assignment = autoPickStarters(squad, formation);
  }

  for (const [playerId, slotIndex] of assignment) {
    await db.update(players).set({ isStarter: true, slotIndex }).where(eq(players.id, playerId));
  }

  return Response.json({ ok: true });
}
