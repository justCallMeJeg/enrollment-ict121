import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const yearId = searchParams.get("yearId")
  const semId = searchParams.get("semId")

  const supabase = await getSupabaseServerClient()
  let query = supabase
    .from("classrooms")
    .select(`
      id, section, created_at,
      course_id, academic_year_id, semester_id, professor_id,
      courses!course_id(id, course_code, name, semester, units, year_level),
      professors!professor_id(faculty_id, users!user_id(name)),
      semesters!semester_id(term, status)
    `)
    .order("created_at", { ascending: true })

  if (yearId) query = query.eq("academic_year_id", yearId)
  if (semId) query = query.eq("semester_id", semId)

  const { data, error } = await query
  if (error) {
    console.error("[classrooms GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const classroomIds = (data ?? []).map((c) => c.id)
  let enrolledCounts: Record<string, number> = {}

  if (classroomIds.length > 0) {
    const { data: enrollmentRows } = await supabase
      .from("enrollments")
      .select("classroom_id")
      .in("classroom_id", classroomIds)
      .eq("status", "enrolled")

    enrolledCounts = (enrollmentRows ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.classroom_id] = (acc[row.classroom_id] ?? 0) + 1
      return acc
    }, {})
  }

  const enriched = (data ?? []).map((c) => ({
    ...c,
    enrolled_count: enrolledCounts[c.id] ?? 0,
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { course_id, academic_year_id, semester_id, professor_id, section } = body

  if (!course_id || !academic_year_id || !semester_id || !section) {
    return NextResponse.json({ error: "course_id, academic_year_id, semester_id and section are required" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("classrooms")
    .insert({
      course_id,
      academic_year_id,
      semester_id,
      professor_id: professor_id ?? null,
      section,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A classroom for this course, semester and section already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
