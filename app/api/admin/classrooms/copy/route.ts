import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { fromYearId, toYearId, toSemesterId } = body

  if (!fromYearId || !toYearId || !toSemesterId) {
    return NextResponse.json({ error: "fromYearId, toYearId and toSemesterId are required" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  // Get the semester being copied into so we know the term
  const { data: targetSem } = await supabase
    .from("semesters")
    .select("term")
    .eq("id", toSemesterId)
    .single()

  if (!targetSem) {
    return NextResponse.json({ error: "Target semester not found" }, { status: 404 })
  }

  // Find classrooms from the source year that match the same term
  const { data: source, error: srcErr } = await supabase
    .from("classrooms")
    .select("course_id, program_id, year_level, section, semesters!inner(term)")
    .eq("academic_year_id", fromYearId)
    .eq("semesters.term", targetSem.term)

  if (srcErr) return NextResponse.json({ error: srcErr.message }, { status: 500 })
  if (!source || source.length === 0) {
    return NextResponse.json({ copied: 0 })
  }

  const rows = source.map((c) => ({
    course_id: c.course_id,
    program_id: c.program_id,
    year_level: c.year_level,
    academic_year_id: toYearId,
    semester_id: toSemesterId,
    professor_id: null,
    section: c.section,
  }))

  const { data: inserted, error: insErr } = await supabase
    .from("classrooms")
    .insert(rows)
    .select()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ copied: inserted?.length ?? 0 })
}
