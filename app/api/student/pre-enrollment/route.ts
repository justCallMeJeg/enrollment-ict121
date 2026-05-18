import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { course_id, academic_year_id } = await request.json()
  if (!course_id || !academic_year_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  const { data: year } = await supabase
    .from("academic_years")
    .select("status")
    .eq("id", academic_year_id)
    .single()

  if (!year || year.status !== "upcoming") {
    return NextResponse.json(
      { error: "Pre-enrollment is only available for upcoming years" },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("pre_enrollments")
    .upsert(
      {
        student_id: session.userId,
        course_id,
        academic_year_id,
        status: "pending",
      },
      { onConflict: "student_id,course_id,academic_year_id" }
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

  const { course_id, academic_year_id } = await request.json()

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from("pre_enrollments")
    .update({ status: "dropped" })
    .eq("student_id", session.userId)
    .eq("course_id", course_id)
    .eq("academic_year_id", academic_year_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
