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

  // Get all classrooms for this academic year so we can find matching pre-enrollments
  const { data: yearClassrooms } = await supabase
    .from("classrooms")
    .select("id")
    .eq("academic_year_id", id)

  const classroomIds = (yearClassrooms ?? []).map((c) => c.id)

  if (classroomIds.length > 0) {
    const { data: preEnrollments } = await supabase
      .from("pre_enrollments")
      .select("student_id, classroom_id")
      .in("classroom_id", classroomIds)
      .eq("status", "pending")

    if (preEnrollments && preEnrollments.length > 0) {
      const enrollments = preEnrollments.map((pe) => ({
        student_id: pe.student_id,
        classroom_id: pe.classroom_id,
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
  }

  // Increment all students' year_level by 1 (capped at 6)
  await supabase.rpc("increment_student_year_levels")

  return NextResponse.json({ ok: true })
}
