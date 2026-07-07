import { db } from "@/db";
import { careers, teams, players, emails } from "@/db/schema";
import { eq } from "drizzle-orm";
import { pick } from "@/lib/engine";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const careerId = Number(id);
  const rows = await db.select().from(emails).where(eq(emails.careerId, careerId));
  rows.sort((a, b) => b.id - a.id);
  return Response.json({ emails: rows });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const careerId = Number(id);
  const body = await req.json().catch(() => ({}));
  const action: string = body.action;

  if (action === "markRead") {
    await db.update(emails).set({ read: true }).where(eq(emails.id, Number(body.emailId)));
    return Response.json({ ok: true });
  }

  if (action === "markAllRead") {
    await db.update(emails).set({ read: true }).where(eq(emails.careerId, careerId));
    return Response.json({ ok: true });
  }

  if (action === "delete") {
    await db.delete(emails).where(eq(emails.id, Number(body.emailId)));
    return Response.json({ ok: true });
  }

  if (action === "acceptOffer" || action === "rejectOffer") {
    const [email] = await db.select().from(emails).where(eq(emails.id, Number(body.emailId)));
    if (!email || email.offerStatus !== "pending") {
      return Response.json({ error: "Proposta não disponível." }, { status: 400 });
    }
    const [career] = await db.select().from(careers).where(eq(careers.id, careerId));
    const controlledId = career.controlledTeamId!;

    if (action === "rejectOffer") {
      await db.update(emails).set({ offerStatus: "rejected", read: true }).where(eq(emails.id, email.id));
      return Response.json({ ok: true });
    }

    // accept: sell player to a random AI team, get the money
    const [player] = await db.select().from(players).where(eq(players.id, email.offerPlayerId!));
    if (!player || player.teamId !== controlledId) {
      await db.update(emails).set({ offerStatus: "expired", read: true }).where(eq(emails.id, email.id));
      return Response.json({ error: "Jogador não está mais no seu elenco." }, { status: 400 });
    }
    const squadCount = (await db.select().from(players).where(eq(players.teamId, controlledId))).length;
    if (squadCount <= 12) {
      return Response.json({ error: "Elenco muito pequeno para vender." }, { status: 400 });
    }
    const amount = email.offerAmount ?? 0;
    const [myTeam] = await db.select().from(teams).where(eq(teams.id, controlledId));
    const buyers = (await db.select().from(teams).where(eq(teams.careerId, careerId))).filter((t) => t.id !== controlledId);
    const buyer = pick(buyers);
    await db.update(players).set({
      teamId: buyer.id, isStarter: false, slotIndex: -1, transferListed: false, askingPrice: 0,
    }).where(eq(players.id, player.id));
    await db.update(teams).set({ saldo: myTeam.saldo + amount }).where(eq(teams.id, controlledId));
    await db.update(emails).set({ offerStatus: "accepted", read: true }).where(eq(emails.id, email.id));
    return Response.json({ ok: true, amount });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
