import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("courses")
    .select(`
      id, course_code, name, semester, units, year_level, created_at,
      course_programs(program_id, programs(id, name, code)),
      course_prerequisites!course_prerequisites_course_id_fkey(prerequisite_course_id, prereq_course:courses!course_prerequisites_prerequisite_course_id_fkey(id, course_code, name))
    `)
    .order("course_code")

  if (error) {
    console.error("[courses GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const normalized = (data ?? []).map((row) => ({
    id: row.id,
    course_code: row.course_code,
    name: row.name,
    semester: row.semester,
    units: row.units,
    year_level: row.year_level,
    created_at: row.created_at,
    programs: (row.course_programs ?? []).map((cp) => {
      const p = Array.isArray(cp.programs) ? cp.programs[0] : cp.programs
      return p ?? null
    }).filter(Boolean),
    prerequisites: (row.course_prerequisites ?? []).map((cp) => {
      const c = Array.isArray(cp.prereq_course) ? cp.prereq_course[0] : cp.prereq_course
      return c ?? null
    }).filter(Boolean),
  }))

  return NextResponse.json(normalized)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { program_ids, course_code, name, semester, units, year_level, prerequisite_course_ids } = body

  if (!course_code || !name || !semester) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  const { data: course, error } = await supabase
    .from("courses")
    .insert({ course_code, name, semester, units: units ?? 3, year_level: year_level ?? 1 })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A course with this code already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const programIds: string[] = Array.isArray(program_ids) ? program_ids : []
  const prereqIds: string[] = Array.isArray(prerequisite_course_ids) ? prerequisite_course_ids : []

  if (programIds.length > 0) {
    await supabase.from("course_programs").insert(
      programIds.map((pid) => ({ course_id: course.id, program_id: pid }))
    )
  }

  if (prereqIds.length > 0) {
    await supabase.from("course_prerequisites").insert(
      prereqIds.map((pid) => ({ course_id: course.id, prerequisite_course_id: pid }))
    )
  }

  return NextResponse.json(course, { status: 201 })
}
