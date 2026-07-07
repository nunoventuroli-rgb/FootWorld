import { db } from "@/db";
import { careers, teams, players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { overall } from "@/lib/engine";

export const dynamic = "force-dynamic";

// Monta o melhor XI de um país a partir de todos os jogadores daquele país no jogo.
function buildNationSquad(all: (typeof players.$inferSelect)[], teamPais: Map<number, string>, pais: string) {
  const list = all.filter((p) => p.teamId > 0 && teamPais.get(p.teamId) === pais);
  const need: Record<string, number> = { GOL: 2, ZAG: 4, LAT: 3, VOL: 3, MEI: 3, ATA: 4 };
  const byPos: Record<string, typeof list> = {};
  for (const p of list) (byPos[p.position] ||= []).push(p);
  for (const k in byPos) byPos[k].sort((a, b) => overall(b) - overall(a));
  const squad: typeof list = [];
  for (const pos in need) squad.push(...(byPos[pos] ?? []).slice(0, need[pos]));
  return squad.sort((a, b) => overall(b) - overall(a)).slice(0, 23);
}

function nationRating(all: (typeof players.$inferSelect)[], teamPais: Map<number, string>, pais: string) {
  const sq = buildNationSquad(all, teamPais, pais).slice(0, 11);
  if (!sq.length) return 50;
  return Math.round(sq.reduce((s, p) => s + overall(p), 0) / sq.length);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const careerId = Number(id);
  const body = await req.json().catch(() => ({}));
  const action: string = body.action;

  const [career] = await db.select().from(careers).where(eq(careers.id, careerId));
  if (!career) return Response.json({ error: "not found" }, { status: 404 });

  if (action === "accept") {
    const pais = (body.pais || "").toString().slice(0, 40);
    if (!pais) return Response.json({ error: "país inválido" }, { status: 400 });
    await db.update(careers).set({ nationalTeam: pais, worldCup: "", updatedAt: new Date() }).where(eq(careers.id, careerId));
    return Response.json({ ok: true, pais });
  }

  if (action === "resign") {
    await db.update(careers).set({ nationalTeam: "", worldCup: "", updatedAt: new Date() }).where(eq(careers.id, careerId));
    return Response.json({ ok: true });
  }

  if (action === "playWorldCup") {
    if (!career.nationalTeam) return Response.json({ error: "Você não comanda uma seleção." }, { status: 400 });
    const allTeams = await db.select().from(teams).where(eq(teams.careerId, careerId));
    const allPlayers = await db.select().from(players).where(eq(players.careerId, careerId));
    const teamPais = new Map(allTeams.map((t) => [t.id, t.pais]));

    // países com jogadores suficientes
    const counts: Record<string, number> = {};
    for (const p of allPlayers) {
      if (p.teamId <= 0) continue;
      const pais = teamPais.get(p.teamId) || "";
      if (pais) counts[pais] = (counts[pais] || 0) + 1;
    }
    let nations = Object.keys(counts).filter((n) => counts[n] >= 11);
    if (!nations.includes(career.nationalTeam)) nations.push(career.nationalTeam);
    // garante que a sua seleção participa; limita a potência de 2 (até 16)
    const ratings: Record<string, number> = {};
    for (const n of nations) ratings[n] = nationRating(allPlayers, teamPais, n);
    nations = nations.sort((a, b) => ratings[b] - ratings[a]);
    let size = 1;
    while (size * 2 <= nations.length && size * 2 <= 16) size *= 2;
    let bracket = nations.slice(0, size);
    if (!bracket.includes(career.nationalTeam)) { bracket[bracket.length - 1] = career.nationalTeam; }
    bracket = bracket.sort(() => Math.random() - 0.5);

    // simula mata-mata; a seleção do humano recebe um pequeno bônus de comando
    const rounds: { a: string; b: string; ga: number; gb: number; winner: string }[][] = [];
    let alive = bracket;
    const poisson = (mean: number) => { const l = Math.exp(-mean); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > l); return k - 1; };
    const myTeam = career.nationalTeam;
    while (alive.length > 1) {
      const round: { a: string; b: string; ga: number; gb: number; winner: string }[] = [];
      const next: string[] = [];
      for (let i = 0; i < alive.length; i += 2) {
        const a = alive[i], b = alive[i + 1];
        let ra = ratings[a] ?? 60, rb = ratings[b] ?? 60;
        if (a === myTeam) ra += 3; if (b === myTeam) rb += 3;
        const diff = ra - rb;
        let ga = poisson(Math.max(0.3, 1.4 + diff / 25));
        let gb = poisson(Math.max(0.3, 1.4 - diff / 25));
        if (ga === gb) (Math.random() < 0.5 + diff / 50 ? ga++ : gb++);
        const winner = ga > gb ? a : b;
        round.push({ a, b, ga, gb, winner });
        next.push(winner);
      }
      rounds.push(round);
      alive = next;
    }
    const champion = alive[0] ?? null;
    const wc = { rounds, champion, ratings, myTeam };
    await db.update(careers).set({ worldCup: JSON.stringify(wc), updatedAt: new Date() }).where(eq(careers.id, careerId));
    return Response.json({ ok: true, champion });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
