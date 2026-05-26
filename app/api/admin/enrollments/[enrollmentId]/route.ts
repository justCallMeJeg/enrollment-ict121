import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  const { enrollmentId } = await params
  const supabase = await getSupabaseServerClient()

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, classroom_id")
    .eq("id", enrollmentId)
    .single()

  if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("semesters!semester_id(status)")
    .eq("id", enrollment.classroom_id)
    .single()

  const sem = classroom
    ? Array.isArray(classroom.semesters) ? classroom.semesters[0] : classroom.semesters
    : null

  if ((sem as { status: string } | null)?.status !== "pre_enrollment") {
    return NextResponse.json({ error: "Students can only be removed during pre-enrollment" }, { status: 409 })
  }

  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("id", enrollmentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
