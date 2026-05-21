import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  // Allowlist patchable fields; academic_year_id is immutable after creation
  const { program_id, professor_id, course_code, name, semester, units, year_level, prerequisite_course_id } = body
  const patch: Record<string, unknown> = {}
  if (program_id !== undefined) patch.program_id = program_id
  if (professor_id !== undefined) patch.professor_id = professor_id ?? null
  if (course_code !== undefined) patch.course_code = course_code
  if (name !== undefined) patch.name = name
  if (semester !== undefined) patch.semester = semester
  if (units !== undefined) patch.units = units
  if (year_level !== undefined) patch.year_level = year_level
  if (prerequisite_course_id !== undefined) patch.prerequisite_course_id = prerequisite_course_id ?? null

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("courses")
    .update(patch)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag("courses")
  revalidateTag("stats")
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
  revalidateTag("courses")
  revalidateTag("stats")
  return NextResponse.json({ ok: true })
}
