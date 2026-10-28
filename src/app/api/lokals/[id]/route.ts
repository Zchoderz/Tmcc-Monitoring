
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db";
import { z } from "zod";
import { getYouTubeId } from "@/lib/youtube";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  youtube_url: z.string().url().max(500),
});

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, ctx: Context) {
  const admin = await getSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const lokalId = Number(id);
  const accountId = Number(admin.id);

  if (
    !Number.isSafeInteger(lokalId) ||
    lokalId <= 0 ||
    !Number.isSafeInteger(accountId) ||
    accountId <= 0
  ) {
    return NextResponse.json({ error: "Invalid Lokal ID." }, { status: 400 });
  }

  try {
    const parsed = schema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a Lokal name and valid YouTube URL." },
        { status: 400 }
      );
    }

    const videoId = getYouTubeId(parsed.data.youtube_url);

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json(
        { error: "That does not look like a valid YouTube video URL." },
        { status: 400 }
      );
    }

    const owned = await sql`
      SELECT id
      FROM lokals
      WHERE id = ${lokalId} AND account_id = ${accountId}
      LIMIT 1
    `;

    if (!owned.length) {
      return NextResponse.json({ error: "Lokal not found." }, { status: 404 });
    }

    await sql`
      UPDATE lokals
      SET name = ${parsed.data.name}
      WHERE id = ${lokalId} AND account_id = ${accountId}
    `;

    const updatedVideo = await sql`
      UPDATE youtube_videos
      SET youtube_video_id = ${videoId},
          title = ${parsed.data.name}
      WHERE lokal_id = ${lokalId}
        AND account_id = ${accountId}
      RETURNING id
    `;

    if (!updatedVideo.length) {
      await sql`
        INSERT INTO youtube_videos
          (account_id, lokal_id, youtube_video_id, title)
        VALUES
          (${accountId}, ${lokalId}, ${videoId}, ${parsed.data.name})
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("update lokal error", error);

    return NextResponse.json(
      { error: "Could not update Lokal." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, ctx: Context) {
  const admin = await getSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const lokalId = Number(id);
  const accountId = Number(admin.id);

  if (
    !Number.isSafeInteger(lokalId) ||
    lokalId <= 0 ||
    !Number.isSafeInteger(accountId) ||
    accountId <= 0
  ) {
    return NextResponse.json({ error: "Invalid Lokal ID." }, { status: 400 });
  }

  try {
    const owned = await sql`
      SELECT id
      FROM lokals
      WHERE id = ${lokalId} AND account_id = ${accountId}
      LIMIT 1
    `;

    if (!owned.length) {
      return NextResponse.json({ error: "Lokal not found." }, { status: 404 });
    }

    await sql.transaction([
      sql`
        DELETE FROM page_visits
        WHERE lokal_id = ${lokalId} AND account_id = ${accountId}
      `,
      sql`
        DELETE FROM video_events
        WHERE lokal_id = ${lokalId} AND account_id = ${accountId}
      `,
      sql`
        DELETE FROM youtube_videos
        WHERE lokal_id = ${lokalId} AND account_id = ${accountId}
      `,
      sql`
        DELETE FROM lokals
        WHERE id = ${lokalId} AND account_id = ${accountId}
      `,
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("delete lokal error", error);

    return NextResponse.json(
      { error: "Could not delete Lokal. Check the deployment logs." },
      { status: 500 }
    );
  }
}
