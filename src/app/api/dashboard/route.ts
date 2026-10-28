import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getSession();

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
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
          SELECT COUNT(DISTINCT p.visitor_id)::int
          FROM page_visits p
          WHERE p.lokal_id = l.id
            AND p.account_id = ${admin.id}
            AND p.visitor_id IS NOT NULL
            AND p.visitor_id <> ''
        ) AS unique_visitors,
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

    const overall = await sql`
      SELECT
        (
          SELECT COUNT(*)::int
          FROM page_visits
          WHERE account_id = ${admin.id}
        ) AS page_visits,
        (
          SELECT COUNT(DISTINCT visitor_id)::int
          FROM page_visits
          WHERE account_id = ${admin.id}
            AND visitor_id IS NOT NULL
            AND visitor_id <> ''
        ) AS unique_visitors,
        (
          SELECT COUNT(*)::int
          FROM video_events
          WHERE account_id = ${admin.id}
            AND event_type = 'video_play'
        ) AS video_plays,
        (
          SELECT COUNT(*)::int
          FROM video_events
          WHERE account_id = ${admin.id}
            AND event_type = 'video_complete'
        ) AS video_complete
    `;

    return NextResponse.json(
      {
        admin,
        lokals: lokals.map((lokal) => ({
          ...lokal,
          id: String(lokal.id),
          page_visits: Number(lokal.page_visits || 0),
          unique_visitors: Number(lokal.unique_visitors || 0),
          video_plays: Number(lokal.video_plays || 0),
          progress_25: Number(lokal.progress_25 || 0),
          progress_50: Number(lokal.progress_50 || 0),
          progress_75: Number(lokal.progress_75 || 0),
          video_complete: Number(lokal.video_complete || 0),
        })),
        overall: {
          page_visits: Number(overall[0].page_visits || 0),
          unique_visitors: Number(overall[0].unique_visitors || 0),
          video_plays: Number(overall[0].video_plays || 0),
          video_complete: Number(overall[0].video_complete || 0),
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (e) {
    console.error("Dashboard error:", e);

    return NextResponse.json(
      { error: "Could not load dashboard." },
      { status: 500 }
    );
  }
}
