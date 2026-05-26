import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const { classroom_id, student_id } = await request.json()

  if (!classroom_id || !student_id) {
    return NextResponse.json({ error: "classroom_id and student_id are required" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, semesters!semester_id(status)")
    .eq("id", classroom_id)
    .single()

  if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 })

  const sem = Array.isArray(classroom.semesters) ? classroom.semesters[0] : classroom.semesters
  if ((sem as { status: string } | null)?.status !== "pre_enrollment") {
    return NextResponse.json({ error: "Students can only be added during pre-enrollment" }, { status: 409 })
  }

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("classroom_id", classroom_id)
    .eq("student_id", student_id)
    .neq("status", "dropped")
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "Student is already enrolled in this classroom" }, { status: 409 })
  }

  const { data, error } = await supabase
    .from("enrollments")
    .insert({ classroom_id, student_id, status: "enrolled" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
