import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { SemesterStatus } from "@/types"

const VALID_TRANSITIONS: Record<SemesterStatus, SemesterStatus | null> = {
  draft: "pre_enrollment",
  pre_enrollment: "active",
  active: "ended",
  ended: null,
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { status } = await request.json() as { status: SemesterStatus }

  const supabase = await getSupabaseServerClient()

  const { data: existing, error: fetchError } = await supabase
    .from("semesters")
    .select("id, status")
    .eq("id", id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Semester not found" }, { status: 404 })
  }

  const allowedNext = VALID_TRANSITIONS[existing.status as SemesterStatus]
  if (status !== allowedNext) {
    return NextResponse.json(
      { error: `Cannot transition from "${existing.status}" to "${status}"` },
      { status: 400 }
    )
  }

  // When activating a semester, convert all pending pre-enrollments to enrollments
  if (existing.status === "pre_enrollment" && status === "active") {
    const { data: classrooms } = await supabase
      .from("classrooms")
      .select("id")
      .eq("semester_id", id)

    const classroomIds = (classrooms ?? []).map((c) => c.id)

    if (classroomIds.length > 0) {
      const { data: preEnrollments } = await supabase
        .from("pre_enrollments")
        .select("student_id, classroom_id")
        .eq("status", "pending")
        .in("classroom_id", classroomIds)

      if (preEnrollments && preEnrollments.length > 0) {
        const { error: enrollError } = await supabase
          .from("enrollments")
          .upsert(
            preEnrollments.map((pe) => ({
              student_id: pe.student_id,
              classroom_id: pe.classroom_id,
              status: "enrolled",
            })),
            { onConflict: "student_id,classroom_id", ignoreDuplicates: true }
          )

        if (enrollError) {
          return NextResponse.json({ error: enrollError.message }, { status: 500 })
        }
      }
    }
  }

  const { data, error } = await supabase
    .from("semesters")
    .update({ status })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const { data: existing, error: fetchError } = await supabase
    .from("semesters")
    .select("id, status")
    .eq("id", id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Semester not found" }, { status: 404 })
  }

  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft semesters can be deleted" },
      { status: 400 }
    )
  }

  const { error } = await supabase.from("semesters").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
