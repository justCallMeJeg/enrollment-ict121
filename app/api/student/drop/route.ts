import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { enrollment_id } = await request.json()
  if (!enrollment_id) {
    return NextResponse.json({ error: "Enrollment ID required" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  // Verify this enrollment belongs to the current student and the year is active
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, student_id, classrooms(semesters(academic_years(status)))")
    .eq("id", enrollment_id)
    .single()

  if (!enrollment || enrollment.student_id !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const classroom = enrollment.classrooms
    ? Array.isArray(enrollment.classrooms) ? enrollment.classrooms[0] : enrollment.classrooms
    : null
  const sem = classroom?.semesters
    ? Array.isArray(classroom.semesters) ? classroom.semesters[0] : classroom.semesters
    : null
  const yearData = sem?.academic_years
    ? Array.isArray(sem.academic_years) ? sem.academic_years[0] : sem.academic_years
    : null

  if (!(yearData as { status: string } | null)?.status || (yearData as { status: string }).status !== "active") {
    return NextResponse.json(
      { error: "Course dropping is only available during an active year" },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from("enrollments")
    .update({ status: "dropped" })
    .eq("id", enrollment_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase
    .from("grades")
    .update({ remarks: "Dropped" })
    .eq("enrollment_id", enrollment_id)

  return NextResponse.json({ ok: true })
}
