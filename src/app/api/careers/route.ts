import { db } from "@/db";
import { careers, teams, players, matches, patches, emails } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { TEAMS_DEF, PatchData, PatchTeamDef, PatchLeague, PosKey } from "@/lib/data";
import { genSquad, buildCalendar, genPlayer, genProspect, randInt } from "@/lib/engine";
import { autoPickStarters } from "@/lib/roster";
import { FREE_AGENT_TEAM_ID, YOUTH_TEAM_ID } from "@/lib/pools";
import { buildCup } from "@/lib/cup";
import { currencyForCountry, continentBonus } from "@/lib/currency";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(careers)
    .orderBy(desc(careers.updatedAt));
  const withTeam = await Promise.all(
    rows.map(async (c) => {
      let teamName = "";
      let team = null as null | typeof teams.$inferSelect;
      if (c.controlledTeamId) {
        const t = await db.select().from(teams).where(eq(teams.id, c.controlledTeamId));
        if (t[0]) {
          teamName = t[0].name;
          team = t[0];
        }
      }
      return { ...c, teamName, team };
    })
  );
  return Response.json({ careers: withTeam });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const coachName: string = (body.coachName || "Técnico").toString().slice(0, 100);
  const coachAge: number = Math.max(25, Math.min(80, Number(body.coachAge) || 45));
  const coachNation: string = (body.coachNation || "Brasil").toString().slice(0, 40);
  const controlledName: string = (body.teamName || "").toString();
  const patchId = body.patchId ? Number(body.patchId) : null;
  const leagueIndex = Number(body.leagueIndex ?? 0);

  // Resolve team list + league name from patch (or default)
  // Suporta DIVISÕES: se a liga escolhida tiver `divBelow`, incluímos a
  // divisão inferior (Série B) na mesma carreira.
  let teamDefsByDiv: { def: PatchTeamDef; division: number }[] = TEAMS_DEF.map((d) => ({ def: d, division: 1 }));
  let leagueName = "Brasileirão Série A";
  let seasonFormat = "ano";
  const worldLeagueMeta: { division: number; name: string; pais: string }[] = [];
  if (patchId) {
    const [patch] = await db.select().from(patches).where(eq(patches.id, patchId));
    if (patch) {
      try {
        const data = JSON.parse(patch.data) as PatchData;
        const league = data.leagues?.[leagueIndex] ?? data.leagues?.[0];
        if (league && league.teams.length >= 2) {
          leagueName = league.name;
          seasonFormat = league.formatoTemporada ?? (league.continente === "Europa" ? "cruzado" : "ano");
          const collected: { def: PatchTeamDef; division: number }[] = [];
          let cur: PatchLeague | undefined = league;
          let div = 1;
          const seen = new Set<number>();
          // segue a cadeia de divisões inferiores
          while (cur && cur.teams.length >= 2 && div <= 4) {
            for (const d of cur.teams) collected.push({ def: d, division: div });
            const bi: number = cur.divBelow ?? -1;
            if (bi < 0 || seen.has(bi)) break;
            seen.add(bi);
            cur = data.leagues[bi];
            div++;
          }
          teamDefsByDiv = collected;

          // MUNDO COM VIDA: cada outra liga vira sua própria divisão (100+),
          // com calendário próprio — assim as tabelas dos outros países são reais.
          const usedNames = new Set(collected.map((c) => c.def.name));
          let worldDiv = 100;
          for (let li = 0; li < data.leagues.length; li++) {
            const lg = data.leagues[li];
            if (lg.type !== "liga") continue;
            const fresh = lg.teams.filter((d) => !usedNames.has(d.name));
            if (fresh.length < 2) continue;
            worldLeagueMeta.push({ division: worldDiv, name: lg.name, pais: lg.pais ?? "" });
            for (const d of fresh) {
              usedNames.add(d.name);
              teamDefsByDiv.push({ def: d, division: worldDiv });
            }
            worldDiv++;
          }
        }
      } catch {
        /* fall back to default */
      }
    }
  }

  const allDefs = teamDefsByDiv.map((x) => x.def);
  const chosenName =
    controlledName && allDefs.some((t) => t.name === controlledName)
      ? controlledName
      : allDefs[0].name;

  // 1. create career
  const [career] = await db
    .insert(careers)
    .values({ coachName, coachAge, coachNation, leagueName, seasonFormat, baseYear: 2026 })
    .returning();

  // 2. create teams (com divisão) — nível ajustado por divisão e continente
  //    - divisões mais baixas => elenco pior
  //    - clubes europeus => mais fortes
  const teamRows = teamDefsByDiv.map(({ def, division }) => {
    const divPenalty = division >= 90 ? 0 : (division - 1) * 8; // Série B ~ -8
    const contBonus = continentBonus(def.pais);
    // Reescala suave: comprime o topo para os craques ficarem ~82-85 (não 94-99).
    // patch 88 -> ~82 ; patch 70 -> ~70 ; patch 60 -> ~62
    const escala = def.nivel <= 70 ? def.nivel : 70 + (def.nivel - 70) * 0.66;
    const nivelAjustado = Math.max(42, Math.min(82, Math.round(escala - divPenalty + contBonus * 0.5)));
    return {
      careerId: career.id,
      name: def.name,
      sigla: def.sigla,
      cor1: def.cor1,
      cor2: def.cor2,
      padrao: def.padrao,
      badge: def.badge ?? "",
      pais: def.pais ?? "",
      estadio: def.estadio ?? "",
      division,
      nivel: nivelAjustado,
      reputation: Math.max(1, def.reputation - (division >= 90 ? 0 : division - 1)),
      saldo: def.saldoM != null
        ? Math.round(def.saldoM * 1_000_000)
        : (def.reputation * 12 + 10) * 1_000_000,
      formation: "4-4-2",
      isControlled: def.name === chosenName,
    };
  });
  const insertedTeams = await db.insert(teams).values(teamRows).returning();
  const defByTeamId = new Map<number, PatchTeamDef>();
  insertedTeams.forEach((t, i) => defByTeamId.set(t.id, teamDefsByDiv[i].def));

  // 3. players — insere todos de uma vez (rápido), depois marca titulares em lote
  type PlayerInsert = typeof players.$inferInsert;
  const allPlayerRows: PlayerInsert[] = [];
  for (const t of insertedTeams) {
    const def = defByTeamId.get(t.id);
    const custom = def?.players && def.players.length >= 11 ? def.players : null;
    if (custom) {
      for (const p of custom) {
        allPlayerRows.push({
          teamId: t.id, careerId: career.id, name: p.name, photo: p.photo ?? "",
          position: p.position, ataque: p.ataque, meio: p.meio, defesa: p.defesa,
          idade: p.idade, forma: 88 + Math.round(Math.random() * 10),
          potential: Math.max(p.potential, Math.round((p.ataque + p.meio + p.defesa) / 3)),
          morale: 65 + Math.round(Math.random() * 15),
        });
      }
    } else {
      for (const p of genSquad(t.nivel, t.pais)) {
        allPlayerRows.push({
          teamId: t.id, careerId: career.id, name: p.name, position: p.position,
          ataque: p.ataque, meio: p.meio, defesa: p.defesa, idade: p.idade,
          forma: p.forma, potential: p.potential, morale: 65 + Math.round(Math.random() * 15),
        });
      }
    }
  }
  const insertedPlayers = await db.insert(players).values(allPlayerRows).returning();

  // agrupa por time e escolhe titulares; grava em lotes paralelos
  const playersByTeam = new Map<number, typeof insertedPlayers>();
  for (const p of insertedPlayers) {
    if (!playersByTeam.has(p.teamId)) playersByTeam.set(p.teamId, []);
    playersByTeam.get(p.teamId)!.push(p);
  }
  const starterWrites: Promise<unknown>[] = [];
  for (const t of insertedTeams) {
    const squad = playersByTeam.get(t.id) ?? [];
    const assignment = autoPickStarters(squad, t.formation);
    for (const [playerId, slotIndex] of assignment) {
      starterWrites.push(db.update(players).set({ isStarter: true, slotIndex }).where(eq(players.id, playerId)));
    }
  }
  for (let i = 0; i < starterWrites.length; i += 30) {
    await Promise.all(starterWrites.slice(i, i + 30));
  }

  // 3b. free agents pool (teamId = 0)
  const freeAgentPositions: PosKey[] = [
    "GOL", "GOL", "ZAG", "ZAG", "ZAG", "LAT", "LAT", "VOL", "VOL",
    "MEI", "MEI", "MEI", "ATA", "ATA", "ATA",
    // a few veterans / prospects
    "ZAG", "MEI", "ATA", "LAT", "VOL",
  ];
  const freeAgents = freeAgentPositions.map((pos) => genPlayer(pos, randInt(52, 80)));
  await db.insert(players).values(
    freeAgents.map((p) => ({
      teamId: FREE_AGENT_TEAM_ID,
      careerId: career.id,
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

  // 3c. youth academy (teamId = YOUTH_TEAM_ID) for the controlled team
  const controlledDef = allDefs.find((t) => t.name === chosenName) ?? allDefs[0];
  const youth = Array.from({ length: 6 }, () =>
    genProspect(Math.max(45, controlledDef.nivel - 20), 15, 19, controlledDef.pais)
  );
  await db.insert(players).values(
    youth.map((p) => ({
      teamId: YOUTH_TEAM_ID,
      careerId: career.id,
      name: p.name,
      position: p.position,
      ataque: p.ataque,
      meio: p.meio,
      defesa: p.defesa,
      idade: p.idade,
      forma: p.forma,
      potential: p.potential,
      isYouth: true,
    }))
  );

  // welcome email
  await db.insert(emails).values({
    careerId: career.id,
    round: 0,
    type: "welcome",
    subject: `Bem-vindo ao ${chosenName}!`,
    body: `Olá ${coachName}, a diretoria confia no seu trabalho. Cuide da tática, da moral do elenco, do treinamento e do mercado. Boa sorte na temporada!`,
  });

  // 4. calendar — cada divisão joga entre si (turno e returno)
  // Todas as divisões (incluindo o mundo 100+) jogam seu próprio campeonato.
  const divisions = Array.from(new Set(insertedTeams.map((t) => t.division))).sort((a, b) => a - b);
  const controlled = insertedTeams.find((t) => t.isControlled) ?? insertedTeams[0];
  const allMatchRows: { careerId: number; round: number; homeTeamId: number; awayTeamId: number }[] = [];
  let totalRounds = 0;
  for (const div of divisions) {
    const ids = insertedTeams.filter((t) => t.division === div).map((t) => t.id);
    if (ids.length < 2) continue;
    const cal = buildCalendar(ids);
    for (const g of cal) allMatchRows.push({ careerId: career.id, round: g.round, homeTeamId: g.home, awayTeamId: g.away });
    // totalRounds = número de rodadas da SUA divisão
    if (div === controlled.division) totalRounds = cal.reduce((m, g) => Math.max(m, g.round), 0);
  }
  if (allMatchRows.length > 0) {
    await db.insert(matches).values(allMatchRows);
  }

  // 5. copa nacional (mata-mata) só com times da 1ª divisão
  const cupTeams = insertedTeams.filter((t) => t.division === 1).map((t) => t.id);
  const cup = buildCup(`Copa ${leagueName}`, cupTeams.length >= 4 ? cupTeams : insertedTeams.map((t) => t.id), totalRounds);

  // 5b. ESTADUAL pré-temporada — mata-mata rápido nas primeiras rodadas,
  //     entre times da 1ª e 2ª divisão do país do jogador
  const estadualTeams = insertedTeams.filter((t) => (t.division === 1 || t.division === 2) && t.pais === controlled.pais).map((t) => t.id);
  const paisNome = controlled.pais || "Estadual";
  const stateCup = estadualTeams.length >= 4
    ? buildCup(`Estadual ${paisNome}`, estadualTeams, totalRounds, { maxSize: 8, consecutive: true })
    : null;

  // 6. expectativa da diretoria — considera só a divisão do clube
  const myDivTeams = insertedTeams.filter((t) => t.division === controlled.division);
  const ranked = [...myDivTeams].sort((a, b) => b.nivel - a.nivel);
  const myRank = ranked.findIndex((t) => t.id === controlled.id) + 1; // 1 = mais forte
  const n = ranked.length;
  let boardTarget: number;
  if (myRank <= Math.ceil(n * 0.15)) boardTarget = 1; // brigar pelo título
  else if (myRank <= Math.ceil(n * 0.35)) boardTarget = Math.max(2, Math.round(n * 0.2));
  else if (myRank <= Math.ceil(n * 0.65)) boardTarget = Math.round(n * 0.5);
  else boardTarget = Math.max(1, n - Math.max(2, controlled.reputation)); // fugir do Z

  // 7. patrocinador (do patch ou automático conforme reputação)
  const chosenDef = defByTeamId.get(controlled.id);
  const sponsorName = chosenDef?.sponsorName || pickSponsor(controlled.reputation);
  const sponsorPerRound = chosenDef?.sponsorM != null
    ? Math.round((chosenDef.sponsorM * 1_000_000) / Math.max(1, totalRounds))
    : Math.round(controlled.reputation * 800_000);
  const sponsorMorale = 2 + controlled.reputation;

  await db
    .update(careers)
    .set({
      controlledTeamId: controlled.id,
      cupData: JSON.stringify(cup),
      boardTarget,
      sponsorName,
      sponsorPerRound,
      sponsorMorale,
      currency: currencyForCountry(controlled.pais),
      worldLeagues: JSON.stringify(worldLeagueMeta),
      stateCup: stateCup ? JSON.stringify(stateCup) : "",
      updatedAt: new Date(),
    })
    .where(eq(careers.id, career.id));

  return Response.json({ id: career.id });
}

const SPONSORS_TOP = ["GlobalTech", "AeroFly", "TurboBank", "Nexon Energy", "PrimeWear"];
const SPONSORS_MID = ["CityMart", "RápidoLog", "Vale Verde", "MegaFoods", "ProSport"];
const SPONSORS_LOW = ["Padaria Central", "Auto Peças Zé", "Mercadinho União", "Bar do Torcedor"];

function pickSponsor(reputation: number): string {
  const pool = reputation >= 4 ? SPONSORS_TOP : reputation >= 3 ? SPONSORS_MID : SPONSORS_LOW;
  return pool[Math.floor(Math.random() * pool.length)];
}
