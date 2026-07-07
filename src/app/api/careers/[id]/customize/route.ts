import { db } from "@/db";
import { careers, teams, players } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Limite defensivo para não estourar a coluna (base64 ~ até ~200KB)
const MAX_IMG = 300_000;

function cleanImg(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  if (v === "") return "";
  if (v.length > MAX_IMG) return undefined;
  return v;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const careerId = Number(id);

  const [career] = await db.select().from(careers).where(eq(careers.id, careerId));
  if (!career) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const target: string = body.target;

  if (target === "career") {
    const upd: Record<string, string> = {};
    const cp = cleanImg(body.coachPhoto);
    const ll = cleanImg(body.leagueLogo);
    if (cp !== undefined) upd.coachPhoto = cp;
    if (ll !== undefined) upd.leagueLogo = ll;
    if (typeof body.coachName === "string" && body.coachName.trim()) {
      upd.coachName = body.coachName.trim().slice(0, 100);
    }
    if (typeof body.currency === "string" && body.currency.length <= 8) {
      upd.currency = body.currency;
    }
    if (Object.keys(upd).length) {
      await db.update(careers).set({ ...upd, updatedAt: new Date() }).where(eq(careers.id, careerId));
    }
    return Response.json({ ok: true });
  }

  if (target === "team") {
    const teamId = Number(body.teamId);
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team || team.careerId !== careerId) {
      return Response.json({ error: "invalid team" }, { status: 400 });
    }
    const upd: Record<string, string> = {};
    const badge = cleanImg(body.badge);
    if (badge !== undefined) upd.badge = badge;
    if (typeof body.name === "string" && body.name.trim()) upd.name = body.name.trim().slice(0, 100);
    if (typeof body.sigla === "string" && body.sigla.trim()) upd.sigla = body.sigla.trim().toUpperCase().slice(0, 5);
    if (typeof body.cor1 === "string") upd.cor1 = body.cor1.slice(0, 12);
    if (typeof body.cor2 === "string") upd.cor2 = body.cor2.slice(0, 12);
    if (typeof body.padrao === "string") upd.padrao = body.padrao.slice(0, 24);
    if (Object.keys(upd).length) {
      await db.update(teams).set(upd).where(eq(teams.id, teamId));
    }
    return Response.json({ ok: true });
  }

  if (target === "player") {
    const playerId = Number(body.playerId);
    const [player] = await db.select().from(players).where(eq(players.id, playerId));
    if (!player || player.careerId !== careerId) {
      return Response.json({ error: "invalid player" }, { status: 400 });
    }
    const upd: Record<string, string> = {};
    const photo = cleanImg(body.photo);
    if (photo !== undefined) upd.photo = photo;
    if (typeof body.name === "string" && body.name.trim()) upd.name = body.name.trim().slice(0, 100);
    if (Object.keys(upd).length) {
      await db.update(players).set(upd).where(eq(players.id, playerId));
    }
    return Response.json({ ok: true });
  }

  return Response.json({ error: "unknown target" }, { status: 400 });
}
