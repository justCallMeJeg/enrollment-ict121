import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("programs")
    .select("*, departments(name, code)")
    .order("name")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { name, code, department_id, years_to_complete } = await request.json()
  if (!name || !code || !department_id)
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("programs")
    .insert({ name, code, department_id, years_to_complete: years_to_complete ?? 4 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
