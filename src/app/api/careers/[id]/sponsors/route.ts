import { db } from "@/db";
import { careers, teams, patches } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PatchData } from "@/lib/data";

export const dynamic = "force-dynamic";

async function patchSponsors(): Promise<{ name: string; perSeason: number; morale: number; tag: string }[] | null> {
  const rows = await db.select().from(patches).where(eq(patches.isDefault, true));
  if (!rows[0]) return null;
  try {
    const data = JSON.parse(rows[0].data) as PatchData;
    const sp = data.sponsors ?? [];
    if (!sp.length) return null;
    return sp.slice(0, 6).map((s) => ({
      name: s.name,
      perSeason: Math.round(s.valorM * 1_000_000),
      morale: s.morale,
      tag: `${s.valorM}M/ano · +${s.morale} moral`,
    }));
  } catch {
    return null;
  }
}

// Ofertas de patrocínio geradas conforme a reputação do clube.
// Retorna 3 opções; o jogador escolhe (POST com index) para fechar o acordo.
const NAMES = [
  "GlobalTech", "AeroFly", "TurboBank", "Nexon Energy", "PrimeWear",
  "CityMart", "RápidoLog", "Vale Verde", "MegaFoods", "ProSport",
  "Zenit Telecom", "Orion Bank", "FastMove", "SolarX", "BravoBet",
];

function seeded(rep: number, round: number) {
  // gera 3 ofertas: uma segura (baixo valor, +moral), uma equilibrada, uma agressiva
  const base = (rep * 700_000) + 400_000;
  const pool = [...NAMES].sort(() => Math.random() - 0.5);
  return [
    { name: pool[0], perSeason: Math.round(base * 8), morale: 5, tag: "Estável (+moral)" },
    { name: pool[1], perSeason: Math.round(base * 12), morale: 3, tag: "Equilibrado" },
    { name: pool[2], perSeason: Math.round(base * 18), morale: 1, tag: "Agressivo ($$$)" },
  ];
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [career] = await db.select().from(careers).where(eq(careers.id, Number(id)));
  if (!career || !career.controlledTeamId) return Response.json({ error: "invalid" }, { status: 400 });
  const [team] = await db.select().from(teams).where(eq(teams.id, career.controlledTeamId));
  const custom = await patchSponsors();
  const offers = custom && custom.length >= 3 ? custom : seeded(team.reputation, career.currentRound);
  return Response.json({
    current: { name: career.sponsorName, perRound: career.sponsorPerRound, morale: career.sponsorMorale },
    offers,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const careerId = Number(id);
  const body = await req.json().catch(() => ({}));
  const [career] = await db.select().from(careers).where(eq(careers.id, careerId));
  if (!career || !career.controlledTeamId) return Response.json({ error: "invalid" }, { status: 400 });
  const [team] = await db.select().from(teams).where(eq(teams.id, career.controlledTeamId));

  // aceita uma oferta enviada pelo cliente (nome/perSeason/morale)
  const name = (body.name || "").toString().slice(0, 80);
  const perSeason = Math.max(0, Number(body.perSeason) || 0);
  const morale = Math.max(0, Math.min(10, Number(body.morale) || 0));
  if (!name) return Response.json({ error: "oferta inválida" }, { status: 400 });

  // estima rodadas na temporada para dividir o valor anual
  const rounds = Math.max(1, (team.reputation ? 0 : 0) + 22);
  const perRound = Math.round(perSeason / rounds);

  await db.update(careers).set({
    sponsorName: name,
    sponsorPerRound: perRound,
    sponsorMorale: morale,
    updatedAt: new Date(),
  }).where(eq(careers.id, careerId));

  return Response.json({ ok: true, name, perRound, morale });
}
