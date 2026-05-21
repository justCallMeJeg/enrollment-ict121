import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth/session"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { enrollmentId } = await params
  const { grade, remarks } = await request.json()

  if (grade === undefined || isNaN(grade) || grade < 1 || grade > 5) {
    return NextResponse.json(
      { error: "Grade must be between 1.00 and 5.00" },
      { status: 400 }
    )
  }

  const supabase = await getSupabaseServerClient()

  // Verify enrollment belongs to a classroom taught by this professor
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, classrooms(professor_id)")
    .eq("id", enrollmentId)
    .single()

  const classroom = enrollment?.classrooms
    ? Array.isArray(enrollment.classrooms)
      ? enrollment.classrooms[0]
      : enrollment.classrooms
    : null

  if (!enrollment || classroom?.professor_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  const { error } = await supabase
    .from("grades")
    .upsert(
      { enrollment_id: enrollmentId, grade, remarks: remarks ?? null },
      { onConflict: "enrollment_id" }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { enrollmentId } = await params
  const supabase = await getSupabaseServerClient()

  // Verify enrollment belongs to a classroom taught by this professor
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, classrooms(professor_id)")
    .eq("id", enrollmentId)
    .single()

  const classroom = enrollment?.classrooms
    ? Array.isArray(enrollment.classrooms)
      ? enrollment.classrooms[0]
      : enrollment.classrooms
    : null

  if (!enrollment || classroom?.professor_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  const { error } = await supabase
    .from("enrollments")
    .update({ status: "dropped" })
    .eq("id", enrollmentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase
    .from("grades")
    .update({ remarks: "Dropped" })
    .eq("enrollment_id", enrollmentId)

  return NextResponse.json({ ok: true })
}
