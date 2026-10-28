import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sql } from "@/lib/db";
import { createSession } from "@/lib/session";
import { randomUUID } from "crypto";
const schema=z.object({name:z.string().trim().min(2).max(80),email:z.string().trim().email().max(254),password:z.string().min(8).max(128)});
export async function POST(req:Request){try{const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Enter a valid name, email, and password of at least 8 characters."},{status:400});const {name,email,password}=parsed.data;const normalized=email.toLowerCase();const existing=await sql`SELECT id FROM admins WHERE email=${normalized} LIMIT 1`;if(existing.length)return NextResponse.json({error:"An account with this email already exists."},{status:409});const id=randomUUID();const password_hash=await bcrypt.hash(password,12);await sql`INSERT INTO admins (id,name,email,password_hash) VALUES (${id},${name},${normalized},${password_hash})`;await createSession({id,email:normalized,name});return NextResponse.json({ok:true})}catch(e){console.error("signup error",e);return NextResponse.json({error:"Could not create account. Check database setup and try again."},{status:500})}}
