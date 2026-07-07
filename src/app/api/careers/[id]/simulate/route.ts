import { db } from "@/db";
import { careers, teams, players, matches, emails } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  simulateMatchT, pickScorers, SimTeam, Tactics,
  trainingGain, clampStat, overall, marketValue, formatMoney, randInt, pick, slotsForFormation, matchStats,
} from "@/lib/engine";
import { FREE_AGENT_TEAM_ID, YOUTH_TEAM_ID, SCOUTED_TEAM_ID } from "@/lib/pools";

export const dynamic = "force-dynamic";

const isPool = (teamId: number) =>
  teamId === FREE_AGENT_TEAM_ID || teamId === YOUTH_TEAM_ID || teamId === SCOUTED_TEAM_ID;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const careerId = Number(id);
  const body = await req.json().catch(() => ({}));
  const toEnd: boolean = !!body.toEnd;
  const saveOnly: boolean = !!body.saveOnly;

  const [career] = await db.select().from(careers).where(eq(careers.id, careerId));
  if (!career) return Response.json({ error: "not found" }, { status: 404 });

  if (saveOnly) {
    await db.update(careers).set({ updatedAt: new Date() }).where(eq(careers.id, careerId));
    return Response.json({ ok: true, saved: true, playedRounds: [], results: [] });
  }

  const allTeams = await db.select().from(teams).where(eq(teams.careerId, careerId));
  const allPlayers = await db.select().from(players).where(eq(players.careerId, careerId));
  const allMatches = await db.select().from(matches).where(eq(matches.careerId, careerId));
  const totalRounds = allMatches.reduce((m, x) => Math.max(m, x.round), 0);
  const controlledId = career.controlledTeamId ?? -999;

  const teamById = new Map(allTeams.map((t) => [t.id, t]));
  const startersByTeam = new Map<number, typeof allPlayers>();
  for (const p of allPlayers) {
    if (p.isStarter) {
      if (!startersByTeam.has(p.teamId)) startersByTeam.set(p.teamId, []);
      startersByTeam.get(p.teamId)!.push(p);
    }
  }

  const tacticsFor = (teamId: number): Tactics => {
    const t = teamById.get(teamId);
    return {
      mentality: t?.mentality ?? "equilibrado",
      pressing: t?.pressing ?? "medio",
      tempo: t?.tempo ?? "normal",
      morale: t?.morale ?? 70,
    };
  };

  const buildSim = (teamId: number): SimTeam => ({
    id: teamId,
    name: teamById.get(teamId)?.name ?? "",
    starters: (startersByTeam.get(teamId) ?? []).map((p) => ({
      ataque: p.ataque, meio: p.meio, defesa: p.defesa,
      forma: Math.min(100, p.forma * (0.85 + (p.morale / 100) * 0.3)),
      position: p.position,
    })),
  });

  // accumulators
  const teamStats = new Map<number, {
    pontos: number; jogos: number; vitorias: number; empates: number;
    derrotas: number; golsPro: number; golsContra: number; morale: number;
  }>();
  for (const t of allTeams) {
    teamStats.set(t.id, {
      pontos: t.pontos, jogos: t.jogos, vitorias: t.vitorias, empates: t.empates,
      derrotas: t.derrotas, golsPro: t.golsPro, golsContra: t.golsContra, morale: t.morale,
    });
  }
  const playerGoals = new Map<number, number>();
  const playerAssists = new Map<number, number>();
  const playerCS = new Map<number, number>();
  const playerGames = new Set<number>();
  const playedRounds: number[] = [];

  // marca clean sheet para o goleiro titular do time
  const markCleanSheet = (teamId: number) => {
    const gk = (startersByTeam.get(teamId) ?? []).find((p) => p.position === "GOL");
    if (gk) playerCS.set(gk.id, (playerCS.get(gk.id) ?? 0) + 1);
  };

  // Mapa jogador -> posição que ele ocupa no time (pelo slot da formação).
  // Usado para "acostumar" jogadores a nova posição depois de muitos jogos fora da natural.
  const slotPosByPlayer = new Map<number, string>();
  for (const t of allTeams) {
    const slots = slotsForFormation(t.formation);
    for (const p of startersByTeam.get(t.id) ?? []) {
      if (p.slotIndex >= 0 && p.slotIndex < slots.length) {
        slotPosByPlayer.set(p.id, slots[p.slotIndex].pos);
      }
    }
  }

  // dá uma assistência a um companheiro (ponderado por meio-campo/passe)
  const addAssist = (teamId: number, scorerId: number) => {
    const squad = (startersByTeam.get(teamId) ?? []).filter((p) => p.id !== scorerId);
    if (squad.length === 0 || Math.random() > 0.65) return;
    const weights = squad.map((p) => Math.max(1, p.meio));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < squad.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        playerAssists.set(squad[i].id, (playerAssists.get(squad[i].id) ?? 0) + 1);
        return;
      }
    }
  };

  const startRound = career.currentRound + 1;
  const endRound = toEnd ? totalRounds : startRound;
  const roundResults: {
    round: number; matchId: number; homeId: number; awayId: number;
    homeGoals: number; awayGoals: number; scorers: string; stats: string;
  }[] = [];

  for (let round = startRound; round <= endRound; round++) {
    const games = allMatches.filter((m) => m.round === round && !m.played);
    if (games.length === 0) continue;
    for (const g of games) {
      const home = buildSim(g.homeTeamId);
      const away = buildSim(g.awayTeamId);
      const { homeGoals, awayGoals } = simulateMatchT(
        home, away, tacticsFor(g.homeTeamId), tacticsFor(g.awayTeamId)
      );

      const homeStarters = (startersByTeam.get(g.homeTeamId) ?? []).map((p) => ({ id: p.id, name: p.name, ataque: p.ataque, meio: p.meio }));
      const awayStarters = (startersByTeam.get(g.awayTeamId) ?? []).map((p) => ({ id: p.id, name: p.name, ataque: p.ataque, meio: p.meio }));
      const hs = pickScorers({ id: g.homeTeamId, starters: homeStarters }, homeGoals);
      const as = pickScorers({ id: g.awayTeamId, starters: awayStarters }, awayGoals);
      const scorers = JSON.stringify({ home: hs, away: as });

      // estatísticas detalhadas só para os JOGOS DO MEU TIME (não pesa o banco)
      let statsJson = "";
      if (g.homeTeamId === controlledId || g.awayTeamId === controlledId) {
        const ms = matchStats(home, away, tacticsFor(g.homeTeamId), tacticsFor(g.awayTeamId), homeGoals, awayGoals, hs, as);
        statsJson = JSON.stringify(ms);
      }

      for (const p of startersByTeam.get(g.homeTeamId) ?? []) playerGames.add(p.id);
      for (const p of startersByTeam.get(g.awayTeamId) ?? []) playerGames.add(p.id);
      for (const s of hs) { playerGoals.set(s.playerId, (playerGoals.get(s.playerId) ?? 0) + 1); addAssist(g.homeTeamId, s.playerId); }
      for (const s of as) { playerGoals.set(s.playerId, (playerGoals.get(s.playerId) ?? 0) + 1); addAssist(g.awayTeamId, s.playerId); }

      // clean sheet: goleiro do time que não sofreu gol
      if (awayGoals === 0) markCleanSheet(g.homeTeamId);
      if (homeGoals === 0) markCleanSheet(g.awayTeamId);

      const hStat = teamStats.get(g.homeTeamId)!;
      const aStat = teamStats.get(g.awayTeamId)!;
      hStat.jogos++; aStat.jogos++;
      hStat.golsPro += homeGoals; hStat.golsContra += awayGoals;
      aStat.golsPro += awayGoals; aStat.golsContra += homeGoals;
      if (homeGoals > awayGoals) {
        hStat.vitorias++; hStat.pontos += 3; aStat.derrotas++;
        hStat.morale = Math.min(100, hStat.morale + 6); aStat.morale = Math.max(20, aStat.morale - 6);
      } else if (homeGoals < awayGoals) {
        aStat.vitorias++; aStat.pontos += 3; hStat.derrotas++;
        aStat.morale = Math.min(100, aStat.morale + 6); hStat.morale = Math.max(20, hStat.morale - 6);
      } else {
        hStat.empates++; aStat.empates++; hStat.pontos++; aStat.pontos++;
        hStat.morale = Math.min(100, hStat.morale + 1); aStat.morale = Math.min(100, aStat.morale + 1);
      }

      roundResults.push({ round, matchId: g.id, homeId: g.homeTeamId, awayId: g.awayTeamId, homeGoals, awayGoals, scorers, stats: statsJson });
    }
    playedRounds.push(round);
  }

  // ---------- COPAS (mata-mata): copa nacional + estadual pré-temporada ----------
  const cupResults: { stage: string; homeId: number; awayId: number; homeGoals: number; awayGoals: number; penHome?: number; penAway?: number; winnerId: number }[] = [];
  const { cupPlayableNow, currentCupTies, faseNome } = await import("@/lib/cup");
  type CupT = import("@/lib/cup").CupData;
  type TieT = import("@/lib/cup").CupTie;

  const parseCup = (s: string): CupT | null => { try { return s ? (JSON.parse(s) as CupT) : null; } catch { return null; } };

  async function runCup(theCup: CupT | null) {
    if (!theCup || theCup.champion) return;
    for (const round of playedRounds) {
      if (!theCup || theCup.champion) break;
      if (!cupPlayableNow(theCup, round)) continue;
      const ties = currentCupTies(theCup);
      const stage = faseNome(ties.length * 2);
      const winners: number[] = [];
      for (const tie of ties) {
        const { homeGoals, awayGoals } = simulateMatchT(buildSim(tie.home), buildSim(tie.away), tacticsFor(tie.home), tacticsFor(tie.away));
        tie.homeGoals = homeGoals; tie.awayGoals = awayGoals; tie.played = true;
        let winnerId: number;
        if (homeGoals > awayGoals) winnerId = tie.home;
        else if (awayGoals > homeGoals) winnerId = tie.away;
        else { let ph = randInt(3, 5), pa = randInt(2, 4); if (ph === pa) ph++; tie.penHome = ph; tie.penAway = pa; winnerId = ph > pa ? tie.home : tie.away; }
        tie.winner = winnerId; winners.push(winnerId);

        for (const p of startersByTeam.get(tie.home) ?? []) playerGames.add(p.id);
        for (const p of startersByTeam.get(tie.away) ?? []) playerGames.add(p.id);
        const hStarters = (startersByTeam.get(tie.home) ?? []).map((p) => ({ id: p.id, name: p.name, ataque: p.ataque, meio: p.meio }));
        const aStarters = (startersByTeam.get(tie.away) ?? []).map((p) => ({ id: p.id, name: p.name, ataque: p.ataque, meio: p.meio }));
        for (const s of pickScorers({ id: tie.home, starters: hStarters }, homeGoals)) { playerGoals.set(s.playerId, (playerGoals.get(s.playerId) ?? 0) + 1); addAssist(tie.home, s.playerId); }
        for (const s of pickScorers({ id: tie.away, starters: aStarters }, awayGoals)) { playerGoals.set(s.playerId, (playerGoals.get(s.playerId) ?? 0) + 1); addAssist(tie.away, s.playerId); }

        const wStat = teamStats.get(winnerId);
        if (wStat) wStat.morale = Math.min(100, wStat.morale + 3);
        cupResults.push({ stage, homeId: tie.home, awayId: tie.away, homeGoals, awayGoals, penHome: tie.penHome, penAway: tie.penAway, winnerId });
      }
      theCup.currentRound++;
      if (winners.length === 1) theCup.champion = winners[0];
      else {
        const next: TieT[] = [];
        for (let i = 0; i < winners.length; i += 2) next.push({ home: winners[i], away: winners[i + 1], homeGoals: 0, awayGoals: 0, played: false, winner: null });
        theCup.rounds.push(next);
      }
    }
  }

  const cup = parseCup(career.cupData);
  const stateCup = parseCup(career.stateCup);
  await runCup(cup);
  await runCup(stateCup);

  // acumula todas as escritas e executa em paralelo (evita travar em "simular até o fim")
  const writes: Promise<unknown>[] = [];

  // persist match results
  for (const r of roundResults) {
    writes.push(db.update(matches).set({
      homeGoals: r.homeGoals, awayGoals: r.awayGoals, played: true, scorers: r.scorers, stats: r.stats,
    }).where(eq(matches.id, r.matchId)));
  }
  // persist team stats
  for (const [teamId, s] of teamStats) {
    writes.push(db.update(teams).set(s).where(eq(teams.id, teamId)));
  }

  const roundsPlayedCount = playedRounds.length;

  // ---------- training progression + morale drift + player match stats ----------
  for (const p of allPlayers) {
    if (isPool(p.teamId) && p.teamId !== YOUTH_TEAM_ID) {
      // pools other than youth don't train
      continue;
    }
    const team = teamById.get(p.teamId);
    const teamFocus = team?.trainingFocus ?? "geral";
    const intensity = team?.trainingIntensity ?? "normal";

    let dA = 0, dM = 0, dD = 0;
    for (let i = 0; i < roundsPlayedCount; i++) {
      const g = trainingGain(
        { ataque: p.ataque + dA, meio: p.meio + dM, defesa: p.defesa + dD, idade: p.idade, potential: p.potential, position: p.position, trainingFocus: p.trainingFocus },
        teamFocus, intensity
      );
      dA += g.ataque; dM += g.meio; dD += g.defesa;
    }

    const addGoals = playerGoals.get(p.id) ?? 0;
    const addAssists = playerAssists.get(p.id) ?? 0;
    const addCS = playerCS.get(p.id) ?? 0;
    const addGame = playerGames.has(p.id) ? 1 : 0;

    // morale drift: players who play keep morale; benchwarmers lose a bit
    let newMorale = p.morale;
    if (roundsPlayedCount > 0 && !isPool(p.teamId)) {
      if (addGame) newMorale = Math.min(100, p.morale + randInt(0, 2));
      else newMorale = Math.max(20, p.morale - randInt(0, 3));
    }

    // Adaptação de posição: se jogou fora da posição natural, acumula.
    // Ao chegar em 8+ jogos, o jogador "se acostuma" e muda de posição.
    let newOutPos = p.outPosGames;
    let newPosition = p.position;
    if (addGame) {
      const slotPos = slotPosByPlayer.get(p.id);
      if (slotPos && slotPos !== p.position) {
        newOutPos = p.outPosGames + 1;
        if (newOutPos >= 8) {
          newPosition = slotPos; // se acostumou à nova posição
          newOutPos = 0;
        }
      } else if (p.outPosGames > 0) {
        newOutPos = Math.max(0, p.outPosGames - 1); // volta ao natural
      }
    }
    const posChanged = newPosition !== p.position || newOutPos !== p.outPosGames;

    if (dA || dM || dD || addGoals || addAssists || addCS || addGame || newMorale !== p.morale || posChanged) {
      writes.push(db.update(players).set({
        ataque: clampStat(p.ataque + dA),
        meio: clampStat(p.meio + dM),
        defesa: clampStat(p.defesa + dD),
        gols: p.gols + addGoals,
        assists: p.assists + addAssists,
        cleanSheets: p.cleanSheets + addCS,
        jogos: p.jogos + addGame,
        morale: newMorale,
        position: newPosition,
        outPosGames: newOutPos,
      }).where(eq(players.id, p.id)));
      // keep local copy fresh for AI transfer logic
      p.ataque = clampStat(p.ataque + dA);
      p.meio = clampStat(p.meio + dM);
      p.defesa = clampStat(p.defesa + dD);
      p.gols += addGoals;
    }
  }

  // executa as escritas em lotes (rápido, mas sem esgotar o pool de conexões)
  for (let i = 0; i < writes.length; i += 20) {
    await Promise.all(writes.slice(i, i + 20));
  }

  // ---------- AI transfer market (once per simulate batch) ----------
  const emailsToInsert: (typeof emails.$inferInsert)[] = [];
  const lastRound = playedRounds[playedRounds.length - 1] ?? career.currentRound;

  // AI clubs try to sign strong performers from other clubs (and make offers for YOUR players)
  const aiTeams = allTeams.filter((t) => t.id !== controlledId);
  // scale with rounds played (roughly one move per round), capped to keep it sane
  const numDeals = Math.min(14, Math.max(1, Math.round(roundsPlayedCount * (0.7 + Math.random() * 0.6))));
  for (let d = 0; d < numDeals; d++) {
    const buyer = pick(aiTeams);
    const buyerStat = teamStats.get(buyer.id);
    // candidate targets: in-season performers not on buyer team, not pools
    const candidates = allPlayers.filter(
      (p) => p.teamId !== buyer.id && !isPool(p.teamId) && (p.gols >= 2 || overall(p) >= 78)
    );
    if (candidates.length === 0) continue;
    // pick a good one weighted by overall + goals
    candidates.sort((a, b) => (overall(b) + b.gols * 2) - (overall(a) + a.gols * 2));
    const target = candidates[randInt(0, Math.min(6, candidates.length - 1))];
    const price = Math.round(marketValue(target) * (1.1 + Math.random() * 0.4));

    if (target.teamId === controlledId) {
      // make an OFFER to the human via email (pending decision)
      emailsToInsert.push({
        careerId, round: lastRound, type: "offer",
        subject: `Proposta do ${buyer.name} por ${target.name}`,
        body: `O ${buyer.name} ofereceu $${formatMoney(price)} pelo seu jogador ${target.name} (${target.position}, ${overall(target)} OVR${target.gols ? `, ${target.gols} gols` : ""}). Você pode aceitar ou recusar na sua caixa de entrada.`,
        offerPlayerId: target.id, offerAmount: price, offerStatus: "pending",
      });
    } else {
      // AI-to-AI transfer (or from free agent pool) — happens automatically
      const sellerId = target.teamId;
      const sellerStat = sellerId > 0 ? teamStats.get(sellerId) : undefined;
      // move player
      await db.update(players).set({
        teamId: buyer.id, isStarter: false, slotIndex: -1, transferListed: false, askingPrice: 0,
      }).where(eq(players.id, target.id));
      target.teamId = buyer.id;
      if (buyerStat) { /* money tracked on team.saldo separately */ }
      await db.update(teams).set({ saldo: Math.max(0, buyer.saldo - price) }).where(eq(teams.id, buyer.id));
      buyer.saldo = Math.max(0, buyer.saldo - price);
      if (sellerId > 0) {
        const seller = teamById.get(sellerId)!;
        await db.update(teams).set({ saldo: seller.saldo + price }).where(eq(teams.id, sellerId));
        seller.saldo += price;
      }
      // notify human as market news
      const fromLabel = sellerId === FREE_AGENT_TEAM_ID ? "agente livre" : teamById.get(sellerId)?.name ?? "outro clube";
      emailsToInsert.push({
        careerId, round: lastRound, type: "market",
        subject: `Mercado: ${buyer.name} contrata ${target.name}`,
        body: `O ${buyer.name} acertou a contratação de ${target.name} (${target.position}, ${overall(target)} OVR) do ${fromLabel} por $${formatMoney(price)}.`,
      });
    }
  }

  // Dedicated bid for one of the human's best players (so offers reliably appear)
  const myPlayers = allPlayers.filter((p) => p.teamId === controlledId);
  const alreadyBid = new Set(emailsToInsert.filter((e) => e.type === "offer").map((e) => e.offerPlayerId));
  if (myPlayers.length > 12 && roundsPlayedCount > 0 && Math.random() < 0.5) {
    const target = [...myPlayers]
      .filter((p) => !alreadyBid.has(p.id))
      .sort((a, b) => (overall(b) + b.gols * 2) - (overall(a) + a.gols * 2))[0];
    if (target) {
      const buyer = pick(aiTeams);
      const price = Math.round(marketValue(target) * (1.15 + Math.random() * 0.5));
      emailsToInsert.push({
        careerId, round: lastRound, type: "offer",
        subject: `Proposta do ${buyer.name} por ${target.name}`,
        body: `O ${buyer.name} ofereceu $${formatMoney(price)} pelo seu jogador ${target.name} (${target.position}, ${overall(target)} OVR${target.gols ? `, ${target.gols} gols na temporada` : ""}). Decida na sua caixa de entrada.`,
        offerPlayerId: target.id, offerAmount: price, offerStatus: "pending",
      });
    }
  }

  // ---------- Convite de seleção nacional (raro, se o desempenho é bom) ----------
  if (roundsPlayedCount > 0 && controlledId > 0) {
    const me = teamById.get(controlledId);
    const myStat = teamStats.get(controlledId);
    if (me && myStat && myStat.jogos >= 5) {
      const winRate = myStat.jogos ? myStat.vitorias / myStat.jogos : 0;
      const already = await db.select().from(emails).where(eq(emails.careerId, careerId));
      const hasInvite = already.some((e) => e.type === "nationalteam");
      if (winRate >= 0.6 && !hasInvite && Math.random() < 0.15) {
        const paises = ["Brasil", "Argentina", "Inglaterra", "Espanha", "Itália", "Alemanha", "França", "Portugal"];
        const pais = paises[Math.floor(Math.random() * paises.length)];
        emailsToInsert.push({
          careerId, round: lastRound, type: "nationalteam",
          subject: `🌎 Convite: comandar a seleção de ${pais}`,
          body: `Parabéns! Pelo seu ótimo trabalho, a Federação de ${pais} convida você para comandar a seleção nacional nas próximas Datas FIFA (acumulando com o seu clube). Uma honra na carreira de qualquer treinador!`,
        });
      }
    }
  }

  if (emailsToInsert.length) {
    await db.insert(emails).values(emailsToInsert);
  }

  const newRound = playedRounds.length ? playedRounds[playedRounds.length - 1] : career.currentRound;
  const careerUpdate: Record<string, unknown> = { currentRound: newRound, updatedAt: new Date() };
  if (cup) careerUpdate.cupData = JSON.stringify(cup);
  if (stateCup) careerUpdate.stateCup = JSON.stringify(stateCup);

  // ---------- Patrocinador + Diretoria ----------
  if (roundsPlayedCount > 0 && controlledId > 0) {
    const ctrl = teamById.get(controlledId);
    const ctrlStat = teamStats.get(controlledId);
    if (ctrl && ctrlStat) {
      // dinheiro do patrocínio por rodada
      const money = (career.sponsorPerRound ?? 0) * roundsPlayedCount;
      if (money > 0) {
        await db.update(teams).set({ saldo: ctrl.saldo + money }).where(eq(teams.id, controlledId));
      }
      // moral extra do patrocínio (uma vez por lote)
      if (career.sponsorMorale) {
        const nm = Math.min(100, ctrlStat.morale + career.sponsorMorale);
        await db.update(teams).set({ morale: nm }).where(eq(teams.id, controlledId));
      }
      // humor da diretoria conforme posição x meta
      const ordered = [...teamStats.entries()].sort((a, b) => {
        const A = a[1], B = b[1];
        if (B.pontos !== A.pontos) return B.pontos - A.pontos;
        return (B.golsPro - B.golsContra) - (A.golsPro - A.golsContra);
      });
      const pos = ordered.findIndex(([tid]) => tid === controlledId) + 1;
      const target = career.boardTarget ?? 10;
      let mood = career.boardMood ?? 70;
      if (pos <= target) mood = Math.min(100, mood + 1);
      else if (pos > target + 3) mood = Math.max(0, mood - 2);
      else mood = Math.max(0, mood - 1);
      careerUpdate.boardMood = mood;
    }
  }

  await db.update(careers).set(careerUpdate).where(eq(careers.id, careerId));

  // e-mails + troféus quando uma copa é decidida
  const already = await db.select().from(emails).where(eq(emails.careerId, careerId));
  let trophies: { name: string; season: number; type: string }[] = [];
  try { trophies = JSON.parse(career.trophies || "[]"); } catch { trophies = []; }
  let trophiesChanged = false;

  for (const finished of [cup, stateCup]) {
    if (finished?.champion) {
      const champ = teamById.get(finished.champion);
      const has = already.some((e) => e.type === "cup" && e.subject.includes(finished.name));
      if (champ && !has) {
        await db.insert(emails).values({
          careerId, round: newRound, type: "cup",
          subject: `🏆 ${finished.name} — Campeão: ${champ.name}`,
          body: `O ${champ.name} conquistou a ${finished.name}!`,
        });
        // registra troféu se foi o meu time
        if (finished.champion === controlledId) {
          trophies.push({ name: finished.name, season: career.season, type: finished === stateCup ? "estadual" : "copa" });
          trophiesChanged = true;
        }
      }
    }
  }
  if (trophiesChanged) {
    await db.update(careers).set({ trophies: JSON.stringify(trophies) }).where(eq(careers.id, careerId));
  }

  return Response.json({ ok: true, playedRounds, results: roundResults, cupResults });
}
