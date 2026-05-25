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

  // Fetch the student's profile for eligibility validation
  const { data: student } = await supabase
    .from("students")
    .select("program_id, year_level, section")
    .eq("user_id", session.userId)
    .single()

  if (!student) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
  }

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, program_id, year_level, section, semesters(status)")
    .eq("id", classroom_id)
    .single()

  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
  }

  const sem = classroom.semesters
    ? Array.isArray(classroom.semesters) ? classroom.semesters[0] : classroom.semesters
    : null

  if (!sem || (sem as { status: string }).status !== "pre_enrollment") {
    return NextResponse.json(
      { error: "Pre-enrollment is not currently open for this semester" },
      { status: 400 }
    )
  }

  // Validate the classroom matches the student's program, year level, and section
  const programMatches =
    classroom.program_id === null || classroom.program_id === student.program_id
  if (!programMatches || classroom.year_level !== student.year_level || classroom.section !== student.section) {
    return NextResponse.json(
      { error: "This classroom is not available for your program, year level, or section" },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from("enrollments")
    .upsert(
      { student_id: session.userId, classroom_id, status: "pre_enrolled" },
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
    .from("enrollments")
    .update({ status: "dropped" })
    .eq("student_id", session.userId)
    .eq("classroom_id", classroom_id)
    .eq("status", "pre_enrolled")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
