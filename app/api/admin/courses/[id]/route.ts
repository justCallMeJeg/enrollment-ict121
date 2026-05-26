import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { program_ids, course_code, name, semester, units, year_level, prerequisite_course_ids } = body

  const supabase = await getSupabaseServerClient()

  // Update core course fields
  const patch: Record<string, unknown> = {}
  if (course_code !== undefined) patch.course_code = course_code
  if (name !== undefined) patch.name = name
  if (semester !== undefined) patch.semester = semester
  if (units !== undefined) patch.units = units
  if (year_level !== undefined) patch.year_level = year_level

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from("courses").update(patch).eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Replace program associations if provided
  if (Array.isArray(program_ids)) {
    await supabase.from("course_programs").delete().eq("course_id", id)
    if (program_ids.length > 0) {
      await supabase.from("course_programs").insert(
        program_ids.map((pid: string) => ({ course_id: id, program_id: pid }))
      )
    }
  }

  // Replace prerequisite associations if provided
  if (Array.isArray(prerequisite_course_ids)) {
    await supabase.from("course_prerequisites").delete().eq("course_id", id)
    if (prerequisite_course_ids.length > 0) {
      await supabase.from("course_prerequisites").insert(
        prerequisite_course_ids.map((pid: string) => ({ course_id: id, prerequisite_course_id: pid }))
      )
    }
  }

  const { data, error } = await supabase.from("courses").select("*").eq("id", id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from("courses").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
