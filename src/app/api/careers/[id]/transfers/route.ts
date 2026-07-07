import { db } from "@/db";
import { careers, teams, players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { marketValue } from "@/lib/engine";
import { fmtMoney } from "@/lib/currency";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const careerId = Number(id);
  const body = await req.json().catch(() => ({}));
  const action: string = body.action;
  const playerId = Number(body.playerId);

  const [career] = await db.select().from(careers).where(eq(careers.id, careerId));
  if (!career || !career.controlledTeamId) {
    return Response.json({ error: "invalid career" }, { status: 400 });
  }
  const controlledId = career.controlledTeamId;
  const fmtCurrency = (v: number) => fmtMoney(v, career.currency || "EUR");

  const [player] = await db.select().from(players).where(eq(players.id, playerId));
  if (!player || player.careerId !== careerId) {
    return Response.json({ error: "invalid player" }, { status: 400 });
  }

  const [myTeam] = await db.select().from(teams).where(eq(teams.id, controlledId));

  if (action === "list") {
    if (player.teamId !== controlledId) return Response.json({ error: "not your player" }, { status: 400 });
    const price = Number(body.price) || marketValue(player);
    await db.update(players).set({ transferListed: true, askingPrice: price }).where(eq(players.id, playerId));
    return Response.json({ ok: true });
  }

  if (action === "unlist") {
    await db.update(players).set({ transferListed: false, askingPrice: 0 }).where(eq(players.id, playerId));
    return Response.json({ ok: true });
  }

  if (action === "sell") {
    if (player.teamId !== controlledId) return Response.json({ error: "not your player" }, { status: 400 });
    const squadCount = (await db.select().from(players).where(eq(players.teamId, controlledId))).length;
    if (squadCount <= 12) {
      return Response.json({ error: "Elenco muito pequeno para vender." }, { status: 400 });
    }
    const value = Math.round(marketValue(player) * 0.9);
    // move to a random AI team so it leaves your squad
    const others = (await db.select().from(teams).where(eq(teams.careerId, careerId))).filter(
      (t) => t.id !== controlledId
    );
    const buyer = others[Math.floor(Math.random() * others.length)];
    await db.update(players).set({
      teamId: buyer.id, isStarter: false, slotIndex: -1, transferListed: false, askingPrice: 0,
    }).where(eq(players.id, playerId));
    await db.update(teams).set({ saldo: myTeam.saldo + value }).where(eq(teams.id, controlledId));
    return Response.json({ ok: true, value });
  }

  if (action === "release") {
    if (player.teamId !== controlledId) return Response.json({ error: "not your player" }, { status: 400 });
    const squadCount = (await db.select().from(players).where(eq(players.teamId, controlledId))).length;
    if (squadCount <= 12) {
      return Response.json({ error: "Elenco muito pequeno para dispensar." }, { status: 400 });
    }
    await db.update(players).set({
      teamId: 0, isStarter: false, slotIndex: -1, transferListed: false, askingPrice: 0,
    }).where(eq(players.id, playerId));
    return Response.json({ ok: true });
  }

  if (action === "sign") {
    // sign a free agent (teamId === 0) for free
    if (player.teamId !== 0) return Response.json({ error: "Não é agente livre." }, { status: 400 });
    const squadCount = (await db.select().from(players).where(eq(players.teamId, controlledId))).length;
    if (squadCount >= 30) {
      return Response.json({ error: "Elenco cheio (máx. 30)." }, { status: 400 });
    }
    await db.update(players).set({
      teamId: controlledId, isStarter: false, slotIndex: -1, transferListed: false, askingPrice: 0,
    }).where(eq(players.id, playerId));
    return Response.json({ ok: true });
  }

  if (action === "signScout") {
    // sign a scouted prospect (teamId === -2) for a small fee
    if (player.teamId !== -2) return Response.json({ error: "Não é jogador observado." }, { status: 400 });
    const squadCount = (await db.select().from(players).where(eq(players.teamId, controlledId))).length;
    if (squadCount >= 30) return Response.json({ error: "Elenco cheio (máx. 30)." }, { status: 400 });
    const fee = Math.max(200_000, Math.round(marketValue(player) * 0.6));
    if (myTeam.saldo < fee) return Response.json({ error: "Saldo insuficiente." }, { status: 400 });
    await db.update(players).set({
      teamId: controlledId, isStarter: false, slotIndex: -1, transferListed: false, askingPrice: 0,
    }).where(eq(players.id, playerId));
    await db.update(teams).set({ saldo: myTeam.saldo - fee }).where(eq(teams.id, controlledId));
    return Response.json({ ok: true, price: fee });
  }

  if (action === "promote") {
    // promote a youth academy player (teamId === -3) to the first team
    if (player.teamId !== -3) return Response.json({ error: "Não é jogador da base." }, { status: 400 });
    const squadCount = (await db.select().from(players).where(eq(players.teamId, controlledId))).length;
    if (squadCount >= 30) return Response.json({ error: "Elenco cheio (máx. 30)." }, { status: 400 });
    await db.update(players).set({
      teamId: controlledId, isYouth: false, isStarter: false, slotIndex: -1,
    }).where(eq(players.id, playerId));
    return Response.json({ ok: true });
  }

  // Oferta com valor customizado: a IA aceita/recusa conforme a proporção
  // entre a oferta e o valor de mercado + importância do jogador no elenco.
  if (action === "offer" || action === "buy") {
    if (player.teamId === controlledId) return Response.json({ error: "já é seu" }, { status: 400 });
    if (player.teamId <= 0) return Response.json({ error: "jogador indisponível" }, { status: 400 });
    const squadCount = (await db.select().from(players).where(eq(players.teamId, controlledId))).length;
    if (squadCount >= 30) return Response.json({ error: "Elenco cheio (máx. 30)." }, { status: 400 });

    const value = marketValue(player);
    const asking = player.transferListed && player.askingPrice > 0 ? player.askingPrice : Math.round(value * 1.3);
    // valor oferecido: usa o do body (offer) ou o pedido (buy rápido)
    const offer = action === "offer" ? Math.round(Number(body.amount) || 0) : asking;
    if (offer <= 0) return Response.json({ error: "Informe um valor válido." }, { status: 400 });
    if (myTeam.saldo < offer) return Response.json({ error: "Saldo insuficiente para essa oferta." }, { status: 400 });

    const [sellerTeam] = await db.select().from(teams).where(eq(teams.id, player.teamId));

    // decisão da IA baseada na razão oferta/valor
    const ratio = offer / Math.max(1, value);
    const isKey = (player.ataque + player.meio + player.defesa) / 3 >= (sellerTeam?.nivel ?? 60) + 3;
    // limiar de aceitação: listado é mais fácil; peça-chave exige bem mais
    let threshold = player.transferListed ? 0.95 : 1.2;
    if (isKey) threshold += 0.35;
    // jogadores mais velhos são mais fáceis de vender
    if (player.idade >= 31) threshold -= 0.2;

    const accept = ratio >= threshold;

    if (!accept) {
      // sugere uma contraproposta
      const counter = Math.round(value * threshold);
      return Response.json({
        ok: false, rejected: true, counter,
        error: `O ${sellerTeam?.name ?? "clube"} recusou ${fmtCurrency(offer)}. Eles querem cerca de ${fmtCurrency(counter)}.`,
      });
    }

    await db.update(players).set({
      teamId: controlledId, isStarter: false, slotIndex: -1, transferListed: false, askingPrice: 0, loanFrom: 0,
    }).where(eq(players.id, playerId));
    await db.update(teams).set({ saldo: myTeam.saldo - offer }).where(eq(teams.id, controlledId));
    if (sellerTeam) {
      await db.update(teams).set({ saldo: sellerTeam.saldo + offer }).where(eq(teams.id, sellerTeam.id));
    }
    return Response.json({ ok: true, price: offer });
  }

  if (action === "loanIn") {
    // empréstimo: jogador de outro clube joga por você por uma temporada, taxa baixa
    if (player.teamId === controlledId || player.teamId <= 0) {
      return Response.json({ error: "Não é possível emprestar este jogador." }, { status: 400 });
    }
    const squadCount = (await db.select().from(players).where(eq(players.teamId, controlledId))).length;
    if (squadCount >= 30) return Response.json({ error: "Elenco cheio (máx. 30)." }, { status: 400 });
    const fee = Math.max(100_000, Math.round(marketValue(player) * 0.08));
    if (myTeam.saldo < fee) return Response.json({ error: "Saldo insuficiente para a taxa de empréstimo." }, { status: 400 });
    const [ownerTeam] = await db.select().from(teams).where(eq(teams.id, player.teamId));
    await db.update(players).set({
      teamId: controlledId, isStarter: false, slotIndex: -1, transferListed: false, askingPrice: 0,
      loanFrom: player.teamId,
    }).where(eq(players.id, playerId));
    await db.update(teams).set({ saldo: myTeam.saldo - fee }).where(eq(teams.id, controlledId));
    if (ownerTeam) await db.update(teams).set({ saldo: ownerTeam.saldo + fee }).where(eq(teams.id, ownerTeam.id));
    return Response.json({ ok: true, price: fee });
  }

  if (action === "returnLoan") {
    // devolve jogador emprestado ao dono
    if (player.teamId !== controlledId || player.loanFrom <= 0) {
      return Response.json({ error: "Este jogador não está emprestado a você." }, { status: 400 });
    }
    const owner = player.loanFrom;
    const [ownerTeam] = await db.select().from(teams).where(eq(teams.id, owner));
    await db.update(players).set({
      teamId: ownerTeam ? owner : 0, isStarter: false, slotIndex: -1, loanFrom: 0,
    }).where(eq(players.id, playerId));
    return Response.json({ ok: true });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
