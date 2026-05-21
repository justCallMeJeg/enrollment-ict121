import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const yearId = searchParams.get("yearId")

  const supabase = await getSupabaseServerClient()
  let query = supabase
    .from("semesters")
    .select("id, academic_year_id, term, status, created_at")
    .order("created_at", { ascending: true })

  if (yearId) query = query.eq("academic_year_id", yearId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
