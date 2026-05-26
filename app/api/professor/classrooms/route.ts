import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await getSupabaseServerClient()

  const { data: classrooms, error } = await supabase
    .from("classrooms")
    .select(`
      id, section, year_level,
      courses!course_id(course_code, name, units, semester),
      semesters!semester_id(term, status, academic_years!inner(label)),
      programs!program_id(id, name, code)
    `)
    .eq("professor_id", session.userId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const classroomIds = (classrooms ?? []).map((c) => c.id)
  let enrolledCounts: Record<string, number> = {}

  if (classroomIds.length > 0) {
    const { data: enrollmentRows } = await supabase
      .from("enrollments")
      .select("classroom_id")
      .in("classroom_id", classroomIds)
      .in("status", ["enrolled", "pre_enrolled"])

    enrolledCounts = (enrollmentRows ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.classroom_id] = (acc[row.classroom_id] ?? 0) + 1
      return acc
    }, {})
  }

  const enriched = (classrooms ?? []).map((c) => ({
    ...c,
    enrolled_count: enrolledCounts[c.id] ?? 0,
  }))

  return NextResponse.json(enriched)
}
