import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") ?? ""
  const classroomId = searchParams.get("classroomId") ?? ""

  const supabase = await getSupabaseServerClient()

  const { data: existing } = await supabase
    .from("enrollments")
    .select("student_id")
    .eq("classroom_id", classroomId)
    .neq("status", "dropped")

  const excludeIds = (existing ?? []).map((e) => e.student_id)

  let query = supabase
    .from("students")
    .select("user_id, student_id, year_level, section, users!user_id(name), programs!program_id(code)")
    .ilike("student_id", `%${search}%`)
    .limit(10)

  if (excludeIds.length > 0) {
    query = query.not("user_id", "in", `(${excludeIds.join(",")})`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
