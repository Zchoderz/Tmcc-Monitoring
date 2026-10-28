import { NextResponse } from "next/server";
import { randomUUID, randomBytes } from "crypto";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getYouTubeId } from "@/lib/youtube";
const schema=z.object({name:z.string().trim().min(1).max(100),description:z.string().max(500).optional().default(""),youtube_url:z.string().url().max(500)});
function slugify(s:string){return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"lokal"}
export async function POST(req:Request){const admin=await getSession();if(!admin)return NextResponse.json({error:"Unauthorized"},{status:401});try{const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Enter a Lokal name and a valid YouTube video URL."},{status:400});const videoId=getYouTubeId(p.data.youtube_url);if(!videoId||!/^[a-zA-Z0-9_-]{11}$/.test(videoId))return NextResponse.json({error:"That does not look like a valid YouTube video URL."},{status:400});const id=randomUUID();const slug=`${slugify(p.data.name)}-${randomBytes(3).toString("hex")}`;await sql`INSERT INTO lokals (id,admin_id,name,description,slug,youtube_url,youtube_video_id) VALUES (${id},${admin.id},${p.data.name},${p.data.description},${slug},${p.data.youtube_url},${videoId})`;return NextResponse.json({ok:true,id,slug})}catch(e){console.error("create lokal error",e);return NextResponse.json({error:"Could not create Lokal."},{status:500})}}
