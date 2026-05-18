import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const { data: target, error: fetchError } = await supabase
    .from("academic_years")
    .select("id, status")
    .eq("id", id)
    .single()

  if (fetchError || !target) {
    return NextResponse.json({ error: "Academic year not found" }, { status: 404 })
  }

  if (target.status !== "upcoming") {
    return NextResponse.json(
      { error: "Only upcoming years can be activated" },
      { status: 400 }
    )
  }

  // End current active year
  await supabase
    .from("academic_years")
    .update({ status: "ended" })
    .eq("status", "active")

  // Activate this year
  const { error: activateError } = await supabase
    .from("academic_years")
    .update({ status: "active" })
    .eq("id", id)

  if (activateError) {
    return NextResponse.json({ error: activateError.message }, { status: 500 })
  }

  // Convert pending pre-enrollments to enrollments
  const { data: preEnrollments } = await supabase
    .from("pre_enrollments")
    .select("student_id, course_id, academic_year_id")
    .eq("academic_year_id", id)
    .eq("status", "pending")

  if (preEnrollments && preEnrollments.length > 0) {
    const enrollments = preEnrollments.map((pe) => ({
      student_id: pe.student_id,
      course_id: pe.course_id,
      academic_year_id: pe.academic_year_id,
      status: "enrolled" as const,
    }))

    const { data: inserted } = await supabase
      .from("enrollments")
      .insert(enrollments)
      .select("id")

    if (inserted && inserted.length > 0) {
      const gradeRows = inserted.map((e) => ({ enrollment_id: e.id }))
      await supabase.from("grades").insert(gradeRows)
    }
  }

  return NextResponse.json({ ok: true })
}
