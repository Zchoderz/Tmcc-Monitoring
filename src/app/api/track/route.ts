
import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({
  slug: z.string().trim().min(1).max(100),
  event_type: z.enum([
    "page_visit",
    "video_play",
    "progress_25",
    "progress_50",
    "progress_75",
    "video_complete",
  ]),
  visitor_id: z.string().trim().min(1).max(100).optional().default(""),
  session_id: z.string().max(100).optional().default(""),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid tracking event." },
        { status: 400 }
      );
    }

    const event = parsed.data;

    const lokals = await sql`
      SELECT id, account_id
      FROM lokals
      WHERE slug = ${event.slug}
      LIMIT 1
    `;

    if (lokals.length === 0) {
      return NextResponse.json(
        { error: "Lokal not found." },
        { status: 404 }
      );
    }

    const lokal = lokals[0];

    if (event.event_type === "page_visit") {
      await sql`
        INSERT INTO page_visits (
          account_id,
          lokal_id,
          visited_at,
          referrer,
          user_agent,
          visitor_id
        )
        VALUES (
          ${lokal.account_id},
          ${lokal.id},
          NOW(),
          ${req.headers.get("referer")},
          ${req.headers.get("user-agent")},
          ${event.visitor_id || null}
        )
      `;
    } else {
      await sql`
        INSERT INTO video_events (
          account_id,
          lokal_id,
          event_type,
          elapsed_seconds,
          occurred_at
        )
        VALUES (
          ${lokal.account_id},
          ${lokal.id},
          ${event.event_type},
          0,
          NOW()
        )
      `;
    }

    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Tracking error:", error);

    return NextResponse.json(
      { error: "Could not record tracking event." },
      { status: 500 }
    );
  }
}

