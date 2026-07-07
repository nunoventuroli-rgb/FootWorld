import { db } from "@/db";
import { careers, teams, players } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { genProspect, randInt } from "@/lib/engine";
import { SCOUTED_TEAM_ID } from "@/lib/pools";

export const dynamic = "force-dynamic";

// Different scout types find different kinds of players.
const SCOUT_TYPES: Record<string, { label: string; cost: number; nivel: [number, number]; age: [number, number]; count: [number, number] }> = {
  base: { label: "Olheiro de Base", cost: 500_000, nivel: [48, 66], age: [15, 18], count: [2, 4] },
  nacional: { label: "Olheiro Nacional", cost: 2_000_000, nivel: [62, 78], age: [18, 24], count: [2, 3] },
  internacional: { label: "Olheiro Internacional", cost: 6_000_000, nivel: [74, 88], age: [20, 29], count: [1, 2] },
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const careerId = Number(id);
  const body = await req.json().catch(() => ({}));
  const type: string = body.type;

  const [career] = await db.select().from(careers).where(eq(careers.id, careerId));
  if (!career || !career.controlledTeamId) {
    return Response.json({ error: "invalid career" }, { status: 400 });
  }
  const [team] = await db.select().from(teams).where(eq(teams.id, career.controlledTeamId));

  // ---- Espionar um time adversário (revela o elenco dele) ----
  if (type === "spy") {
    const spyCost = 800_000;
    const targetId = Number(body.teamId);
    if (!targetId || targetId === team.id) return Response.json({ error: "time inválido" }, { status: 400 });
    if (team.saldo < spyCost) return Response.json({ error: "Saldo insuficiente para espionar." }, { status: 400 });
    let scouted: number[] = [];
    try { scouted = JSON.parse(career.scoutedTeams || "[]"); } catch { scouted = []; }
    if (!scouted.includes(targetId)) scouted.push(targetId);
    await db.update(careers).set({ scoutedTeams: JSON.stringify(scouted) }).where(eq(careers.id, careerId));
    await db.update(teams).set({ saldo: team.saldo - spyCost }).where(eq(teams.id, team.id));
    return Response.json({ ok: true, spied: targetId });
  }

  const conf = SCOUT_TYPES[type];
  if (!conf) return Response.json({ error: "tipo inválido" }, { status: 400 });
  if (team.saldo < conf.cost) {
    return Response.json({ error: "Saldo insuficiente para contratar este olheiro." }, { status: 400 });
  }

  const n = randInt(conf.count[0], conf.count[1]);
  const found = Array.from({ length: n }, () =>
    genProspect(randInt(conf.nivel[0], conf.nivel[1]), conf.age[0], conf.age[1])
  );
  await db.insert(players).values(
    found.map((p) => ({
      teamId: SCOUTED_TEAM_ID,
      careerId,
      name: p.name,
      position: p.position,
      ataque: p.ataque,
      meio: p.meio,
      defesa: p.defesa,
      idade: p.idade,
      forma: p.forma,
      potential: p.potential,
    }))
  );

  await db.update(teams).set({ saldo: team.saldo - conf.cost }).where(eq(teams.id, team.id));

  return Response.json({ ok: true, found: found.length, cost: conf.cost });
}

// clear scouted list
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const careerId = Number(id);
  await db.delete(players).where(and(eq(players.careerId, careerId), eq(players.teamId, SCOUTED_TEAM_ID)));
  return Response.json({ ok: true });
}
