import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("courses")
    .select("*, programs(name, code), professors(faculty_id, users(name))")
    .order("course_code")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    program_id,
    professor_id,
    course_code,
    name,
    semester,
    units,
    year_level,
    prerequisite_course_id,
  } = body

  if (!program_id || !course_code || !name || !semester) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("courses")
    .insert({
      program_id,
      professor_id: professor_id ?? null,
      course_code,
      name,
      semester,
      units: units ?? 3,
      year_level: year_level ?? 1,
      prerequisite_course_id: prerequisite_course_id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
