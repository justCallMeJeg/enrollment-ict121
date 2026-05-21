import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { classroom_id } = await request.json()
  if (!classroom_id) {
    return NextResponse.json({ error: "classroom_id is required" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  // Verify the classroom is in an upcoming academic year
  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, semesters(academic_years(status))")
    .eq("id", classroom_id)
    .single()

  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
  }

  const sem = classroom.semesters
    ? Array.isArray(classroom.semesters) ? classroom.semesters[0] : classroom.semesters
    : null
  const year = sem?.academic_years
    ? Array.isArray(sem.academic_years) ? sem.academic_years[0] : sem.academic_years
    : null

  if (!year || (year as { status: string }).status !== "upcoming") {
    return NextResponse.json(
      { error: "Pre-enrollment is only available for upcoming years" },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("pre_enrollments")
    .upsert(
      { student_id: session.userId, classroom_id, status: "pending" },
      { onConflict: "student_id,classroom_id" }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { classroom_id } = await request.json()
  if (!classroom_id) {
    return NextResponse.json({ error: "classroom_id is required" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from("pre_enrollments")
    .update({ status: "dropped" })
    .eq("student_id", session.userId)
    .eq("classroom_id", classroom_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
