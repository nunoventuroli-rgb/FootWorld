import { db } from "@/db";
import { patches } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { defaultPatchData } from "@/lib/data";

export const dynamic = "force-dynamic";

async function ensureDefault() {
  const existing = await db.select().from(patches).where(eq(patches.isDefault, true));
  const fresh = defaultPatchData();
  if (existing.length === 0) {
    await db.insert(patches).values({
      name: "Patch Mundial",
      author: "Worldfoot",
      isDefault: true,
      data: JSON.stringify(fresh),
    });
    return;
  }
  // mantém o patch padrão atualizado com as ligas mundiais mais recentes
  const cur = existing[0];
  let leaguesCount = 0;
  try {
    leaguesCount = (JSON.parse(cur.data).leagues ?? []).length;
  } catch {
    leaguesCount = 0;
  }
  if (leaguesCount < fresh.leagues.length) {
    await db
      .update(patches)
      .set({ name: "Patch Mundial", data: JSON.stringify(fresh), updatedAt: new Date() })
      .where(eq(patches.id, cur.id));
  }
}

export async function GET() {
  await ensureDefault();
  const rows = await db.select().from(patches).orderBy(desc(patches.isDefault), desc(patches.updatedAt));
  const parsed = rows.map((p) => ({
    id: p.id,
    name: p.name,
    author: p.author,
    isDefault: p.isDefault,
    data: safeParse(p.data),
  }));
  return Response.json({ patches: parsed });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name: string = (body.name || "Novo Patch").toString().slice(0, 100);
  const author: string = (body.author || "").toString().slice(0, 100);
  const data = body.data ?? { leagues: [] };
  const [row] = await db
    .insert(patches)
    .values({ name, author, data: JSON.stringify(data) })
    .returning();
  return Response.json({ id: row.id });
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return { leagues: [] };
  }
}
