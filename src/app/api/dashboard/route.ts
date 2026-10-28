
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const admin = await getSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lokals = await sql`
      SELECT
        l.id,
        l.name,
        l.slug,
        l.created_at,
        (
          SELECT COUNT(*)::int
          FROM page_visits p
          WHERE p.lokal_id = l.id
            AND p.account_id = ${admin.id}
        ) AS page_visits,
        (
          SELECT COUNT(*)::int
          FROM video_events v
          WHERE v.lokal_id = l.id
            AND v.account_id = ${admin.id}
            AND v.event_type = 'video_play'
        ) AS video_plays,
        (
          SELECT COUNT(*)::int
          FROM video_events v
          WHERE v.lokal_id = l.id
            AND v.account_id = ${admin.id}
            AND v.event_type = 'progress_25'
        ) AS progress_25,
        (
          SELECT COUNT(*)::int
          FROM video_events v
          WHERE v.lokal_id = l.id
            AND v.account_id = ${admin.id}
            AND v.event_type = 'progress_50'
        ) AS progress_50,
        (
          SELECT COUNT(*)::int
          FROM video_events v
          WHERE v.lokal_id = l.id
            AND v.account_id = ${admin.id}
            AND v.event_type = 'progress_75'
        ) AS progress_75,
        (
          SELECT COUNT(*)::int
          FROM video_events v
          WHERE v.lokal_id = l.id
            AND v.account_id = ${admin.id}
            AND v.event_type = 'video_complete'
        ) AS video_complete
      FROM lokals l
      WHERE l.account_id = ${admin.id}
      ORDER BY l.created_at DESC
    `;

    return NextResponse.json({ admin, lokals });
  } catch (e) {
    console.error("dashboard error", e);

    return NextResponse.json(
      { error: "Could not load dashboard." },
      { status: 500 }
    );
  }
}
