
import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getYouTubeId } from "@/lib/youtube";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  youtube_url: z.string().url().max(500),
});

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "lokal"
  );
}

export async function POST(req: Request) {
  const admin = await getSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = schema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a Lokal name and a valid YouTube video URL." },
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

    const accountId = Number(admin.id);

    if (!Number.isSafeInteger(accountId) || accountId <= 0) {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    const slugBase = slugify(parsed.data.name);
    const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;

    const result = await sql`
      INSERT INTO lokals (account_id, name, slug)
      VALUES (${accountId}, ${parsed.data.name}, ${slug})
      RETURNING id, name, slug
    `;

    const lokal = result[0];

    await sql`
      INSERT INTO youtube_videos (account_id, lokal_id, youtube_video_id, title)
      VALUES (${accountId}, ${lokal.id}, ${videoId}, ${parsed.data.name})
    `;

    return NextResponse.json({
      ok: true,
      id: lokal.id,
      slug: lokal.slug,
    });
  } catch (error) {
    console.error("create lokal error", error);

    return NextResponse.json(
      { error: "Could not create Lokal. Check the deployment logs." },
      { status: 500 }
    );
  }
}
