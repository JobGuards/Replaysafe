import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

// Lazily create the SQL client so the module still loads even without DATABASE_URL
// (e.g. during static page generation of non-API routes)
function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  return neon(url);
}

// Ensure the table exists — runs once per cold-start, idempotent
async function ensureTable() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id          SERIAL PRIMARY KEY,
      email       TEXT NOT NULL,
      source      TEXT NOT NULL DEFAULT 'pricing_page',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT waitlist_email_unique UNIQUE (email)
    )
  `;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const source = (body.source ?? "pricing_page").trim();

    // Basic validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    await ensureTable();
    const sql = getSql();

    // Insert — silently ignore duplicate emails (idempotent)
    const rows = await sql`
      INSERT INTO waitlist (email, source)
      VALUES (${email}, ${source})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, created_at
    `;

    const alreadyExists = rows.length === 0;

    return NextResponse.json(
      {
        success: true,
        message: alreadyExists
          ? "You're already on the list — we'll reach out soon!"
          : "You're on the list! We'll notify you when Cloud launches.",
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[waitlist] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

// Block other methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
