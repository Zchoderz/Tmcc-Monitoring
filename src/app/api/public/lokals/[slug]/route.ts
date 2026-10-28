
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Context = {
  params: Promise<{ slug: string }>;
};

export async function GET(_req: Request, ctx: Context) {
  const { slug } = await ctx.params;

  try {
    const rows = await sql`
      SELECT
        l.name,
        l.slug,
        y.youtube_video_id,
        y.title
      FROM lokals l
      LEFT JOIN youtube_videos y
        ON y.lokal_id = l.id
       AND y.account_id = l.account_id
      WHERE l.slug = ${slug}
      ORDER BY y.created_at DESC
      LIMIT 1
    `;

    if (!rows.length || !rows[0].youtube_video_id) {
      return NextResponse.json(
        { error: "Lokal or its assigned YouTube video was not found." },
        { status: 404 }
      );
    }

    const lokal = rows[0];
    const videoId = String(lokal.youtube_video_id);

    return NextResponse.json(
      {
        lokal: {
          name: String(lokal.name),
          description: "",
          slug: String(lokal.slug),
          youtube_video_id: videoId,
          youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
          is_active: true
        }
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("public lokal error", error);

    return NextResponse.json(
      { error: "Could not load Lokal page." },
      { status: 500 }
    );
  }
}
