import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sql } from "@/lib/db";
import { createSession } from "@/lib/session";
const schema=z.object({email:z.string().email().max(254),password:z.string().min(1).max(128)});
export async function POST(req:Request){try{const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Enter a valid email and password."},{status:400});const email=parsed.data.email.toLowerCase();const rows=await sql`SELECT id,name,email,password_hash FROM admins WHERE email=${email} LIMIT 1`;if(!rows.length||!(await bcrypt.compare(parsed.data.password,String(rows[0].password_hash))))return NextResponse.json({error:"Email or password is incorrect."},{status:401});await createSession({id:String(rows[0].id),name:String(rows[0].name),email:String(rows[0].email)});return NextResponse.json({ok:true})}catch(e){console.error("login error",e);return NextResponse.json({error:"Could not sign in. Check database setup and try again."},{status:500})}}
