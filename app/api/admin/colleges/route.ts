import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.from("colleges").select("*").order("name")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { name, code } = await request.json()
  if (!name || !code)
    return NextResponse.json({ error: "Name and code are required" }, { status: 400 })

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("colleges")
    .insert({ name, code })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag("programs")
  return NextResponse.json(data, { status: 201 })
}
