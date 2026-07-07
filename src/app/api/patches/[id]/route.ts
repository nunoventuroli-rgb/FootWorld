import { db } from "@/db";
import { patches } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [row] = await db.select().from(patches).where(eq(patches.id, Number(id)));
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({
    id: row.id,
    name: row.name,
    author: row.author,
    isDefault: row.isDefault,
    data: safeParse(row.data),
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.name === "string") update.name = body.name.slice(0, 100);
  if (typeof body.author === "string") update.author = body.author.slice(0, 100);
  if (body.data) update.data = JSON.stringify(body.data);
  await db.update(patches).set(update).where(eq(patches.id, Number(id)));
  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [row] = await db.select().from(patches).where(eq(patches.id, Number(id)));
  if (row?.isDefault) {
    return Response.json({ error: "Não é possível excluir o patch padrão." }, { status: 400 });
  }
  await db.delete(patches).where(eq(patches.id, Number(id)));
  return Response.json({ ok: true });
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return { leagues: [] };
  }
}
