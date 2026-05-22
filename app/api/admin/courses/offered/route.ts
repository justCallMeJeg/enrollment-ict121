import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const yearId = new URL(request.url).searchParams.get("yearId")
  if (!yearId) return NextResponse.json({ error: "yearId is required" }, { status: 400 })

  const supabase = await getSupabaseServerClient()

  // Distinct courses that have at least one classroom in this academic year
  const { data, error } = await supabase
    .from("classrooms")
    .select("course_id, semester_id, semesters!semester_id(term, status), courses!course_id(id, course_code, name, semester, units, year_level, program_id, programs!program_id(name, code))")
    .eq("academic_year_id", yearId)

  if (error) {
    console.error("[courses/offered GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Deduplicate by course_id and attach semester info
  const seen = new Set<string>()
  const courses = (data ?? []).reduce<{
    id: string; course_code: string; name: string; semester: string;
    units: number; year_level: number; program_id: string | null;
    programs: { name: string; code: string } | null
    semesters: { term: string; status: string }[]
  }[]>((acc, row) => {
    const course = Array.isArray(row.courses) ? row.courses[0] : row.courses as typeof acc[0]
    if (!course) return acc
    if (!seen.has(course.id)) {
      seen.add(course.id)
      const programs = Array.isArray(course.programs) ? (course.programs[0] ?? null) : (course.programs ?? null)
      acc.push({ ...course, programs, semesters: [] })
    }
    const sem = Array.isArray(row.semesters) ? row.semesters[0] : row.semesters
    if (sem) {
      const existing = acc.find((c) => c.id === course.id)
      if (existing && !existing.semesters.some((s) => s.term === sem.term)) {
        existing.semesters.push(sem)
      }
    }
    return acc
  }, [])

  return NextResponse.json(courses)
}
