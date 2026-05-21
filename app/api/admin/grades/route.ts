import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const yearId = searchParams.get("yearId")
  const semId = searchParams.get("semId")

  if (!yearId || !semId) {
    return NextResponse.json({ error: "yearId and semId are required" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  const { data: semester } = await supabase
    .from("semesters")
    .select("term")
    .eq("id", semId)
    .single()

  if (!semester) {
    return NextResponse.json([], { status: 200 })
  }

  const { data: semCourses } = await supabase
    .from("courses")
    .select("id, course_code, name")
    .eq("academic_year_id", yearId)
    .eq("semester", semester.term)

  const courseMap = new Map(
    (semCourses ?? []).map((c) => [c.id, { code: c.course_code, name: c.name }])
  )
  const courseIds = [...courseMap.keys()]

  if (courseIds.length === 0) {
    return NextResponse.json([], { status: 200 })
  }

  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select(
      "id, course_id, students!inner(student_id, section, users!inner(name)), grades(grade, remarks)"
    )
    .in("course_id", courseIds)
    .eq("status", "enrolled")
    .order("created_at")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (enrollments ?? []).map((e) => {
    const student = Array.isArray(e.students) ? e.students[0] : e.students
    const grade = Array.isArray(e.grades) ? e.grades[0] : e.grades
    const user = student
      ? Array.isArray(student.users) ? student.users[0] : student.users
      : null
    const course = courseMap.get(e.course_id)
    return {
      enrollmentId: e.id,
      studentId: student?.student_id ?? "—",
      studentName: user?.name ?? "—",
      section: student?.section ?? "—",
      courseCode: course?.code ?? "—",
      courseName: course?.name ?? "—",
      grade: grade?.grade ?? null,
      remarks: grade?.remarks ?? null,
    }
  })

  return NextResponse.json(rows)
}
