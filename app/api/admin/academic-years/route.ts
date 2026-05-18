import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("academic_years")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { label } = await request.json()

  if (!label) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  const { data: existing } = await supabase
    .from("academic_years")
    .select("id")
    .eq("status", "upcoming")
    .single()

  if (existing) {
    return NextResponse.json(
      { error: "An upcoming academic year already exists" },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from("academic_years")
    .insert({ label, status: "upcoming" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
