import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaceState } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emptyState = (partners: { id: string; name: string }[]) => ({
  bookings: [],
  transactions: [],
  reimbursements: [],
  assets: [],
  partners,
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const partnerUsers = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.active, true));
    const [record] = await db
      .select()
      .from(workspaceState)
      .where(eq(workspaceState.id, 1))
      .limit(1);

    const state =
      record?.payload ??
      emptyState(partnerUsers.map((p) => ({ id: String(p.id), name: p.name })));
    // Keep partner display names in sync with the actual login accounts, without creating duplicate identities.
    const current = state as Record<string, unknown>;
    if (Array.isArray(current.transactions)) {
      current.transactions = current.transactions.map(
        (transaction: Record<string, unknown>) => ({
          ...transaction,
          account: "Kas Rona",
        }),
      );
    }
    current.partners = partnerUsers.map((p) => ({
      id: String(p.id),
      name: p.name,
    }));
    return NextResponse.json({ state, updatedAt: record?.updatedAt ?? null });
  } catch (error) {
    console.error("Workspace GET:", error);
    return NextResponse.json(
      { error: "Gagal membaca PostgreSQL. Pastikan migrasi sudah dijalankan." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const state = body?.state;
    if (
      !state ||
      typeof state !== "object" ||
      !Array.isArray(state.bookings) ||
      !Array.isArray(state.transactions) ||
      !Array.isArray(state.reimbursements) ||
      !Array.isArray(state.assets)
    ) {
      return NextResponse.json(
        { error: "Format data workspace tidak valid." },
        { status: 400 },
      );
    }
    // Partners are sourced from authenticated partner accounts, not client-provided names.
    const partnerUsers = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.active, true));
    const payload = {
      bookings: state.bookings,
      transactions: state.transactions.map(
        (transaction: Record<string, unknown>) => ({
          ...transaction,
          account: "Kas Rona",
        }),
      ),
      reimbursements: state.reimbursements,
      assets: state.assets,
      partners: partnerUsers.map((p) => ({ id: String(p.id), name: p.name })),
    };
    await db
      .insert(workspaceState)
      .values({
        id: 1,
        payload,
        updatedByUserId: session.id,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: workspaceState.id,
        set: { payload, updatedByUserId: session.id, updatedAt: new Date() },
      });
    return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Workspace PUT:", error);
    return NextResponse.json(
      {
        error:
          "Gagal menyimpan ke PostgreSQL. Periksa koneksi database dan migrasi.",
      },
      { status: 500 },
    );
  }
}
