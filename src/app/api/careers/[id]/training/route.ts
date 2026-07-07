import { db } from "@/db";
import { careers, teams, players } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { YOUTH_TEAM_ID } from "@/lib/pools";

export const dynamic = "force-dynamic";

const FOCUS = ["geral", "ataque", "meio", "defesa"];
const INTENSITY = ["leve", "normal", "intenso"];
const PLAYER_FOCUS = ["auto", "ataque", "meio", "defesa"];

function clamp(v: number) { return Math.max(20, Math.min(99, Math.round(v))); }

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const careerId = Number(id);
  const body = await req.json().catch(() => ({}));

  const [career] = await db.select().from(careers).where(eq(careers.id, careerId));
  if (!career || !career.controlledTeamId) {
    return Response.json({ error: "invalid career" }, { status: 400 });
  }
  const teamId = career.controlledTeamId;

  // ---- Treinar categoria de base (custa dinheiro, evolui os jovens) ----
  if (body.action === "trainYouth") {
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    const cost = 300_000;
    if (team.saldo < cost) return Response.json({ error: "Saldo insuficiente para treino da base." }, { status: 400 });
    const youth = await db.select().from(players).where(and(eq(players.careerId, careerId), eq(players.teamId, YOUTH_TEAM_ID)));
    let evolved = 0;
    for (const p of youth) {
      const ovr = Math.round((p.ataque + p.meio + p.defesa) / 3);
      if (ovr >= p.potential) continue;
      // jovens evoluem forte; escolhe atributo principal da posição
      const gain = 1 + (Math.random() < 0.4 ? 1 : 0);
      const attr = ["ATA", "PON"].includes(p.position) ? "ataque" : ["MEI", "VOL"].includes(p.position) ? "meio" : "defesa";
      const cur = attr === "ataque" ? p.ataque : attr === "meio" ? p.meio : p.defesa;
      await db.update(players).set({ [attr]: clamp(cur + gain) }).where(eq(players.id, p.id));
      evolved++;
    }
    await db.update(teams).set({ saldo: team.saldo - cost }).where(eq(teams.id, teamId));
    return Response.json({ ok: true, evolved });
  }

  // ---- Estágio intensivo individual (treino avançado pago) ----
  if (body.action === "intensive") {
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    const [p] = await db.select().from(players).where(eq(players.id, Number(body.playerId)));
    if (!p || p.teamId !== teamId) return Response.json({ error: "jogador inválido" }, { status: 400 });
    const ovr = Math.round((p.ataque + p.meio + p.defesa) / 3);
    if (ovr >= p.potential) return Response.json({ error: "Jogador já atingiu o potencial máximo." }, { status: 400 });
    // custo proporcional ao overall; jovens rendem mais
    const cost = Math.max(500_000, ovr * 60_000);
    if (team.saldo < cost) return Response.json({ error: "Saldo insuficiente para o estágio intensivo." }, { status: 400 });
    const room = p.potential - ovr;
    const gain = p.idade <= 23 ? Math.min(room, 2 + (Math.random() < 0.5 ? 1 : 0)) : Math.min(room, 1);
    const focus: string = body.attr === "ataque" || body.attr === "meio" || body.attr === "defesa"
      ? body.attr
      : (["ATA", "PON"].includes(p.position) ? "ataque" : ["MEI", "VOL"].includes(p.position) ? "meio" : "defesa");
    const cur = focus === "ataque" ? p.ataque : focus === "meio" ? p.meio : p.defesa;
    await db.update(players).set({ [focus]: clamp(cur + gain), forma: Math.max(60, p.forma - 8) }).where(eq(players.id, p.id));
    await db.update(teams).set({ saldo: team.saldo - cost }).where(eq(teams.id, teamId));
    return Response.json({ ok: true, gain, attr: focus, cost });
  }

  // team-wide training settings
  const upd: Record<string, string> = {};
  if (typeof body.trainingFocus === "string" && FOCUS.includes(body.trainingFocus)) {
    upd.trainingFocus = body.trainingFocus;
  }
  if (typeof body.trainingIntensity === "string" && INTENSITY.includes(body.trainingIntensity)) {
    upd.trainingIntensity = body.trainingIntensity;
  }
  if (Object.keys(upd).length) {
    await db.update(teams).set(upd).where(eq(teams.id, teamId));
  }

  // individual player focus
  if (body.playerId && typeof body.playerFocus === "string" && PLAYER_FOCUS.includes(body.playerFocus)) {
    const [p] = await db.select().from(players).where(eq(players.id, Number(body.playerId)));
    if (p && p.teamId === teamId) {
      await db.update(players).set({ trainingFocus: body.playerFocus }).where(eq(players.id, p.id));
    }
  }

  return Response.json({ ok: true });
}
