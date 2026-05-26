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

  // Fetch classrooms for this semester (joins course info)
  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("id, section, courses(course_code, name)")
    .eq("academic_year_id", yearId)
    .eq("semester_id", semId)

  if (!classrooms || classrooms.length === 0) {
    return NextResponse.json([])
  }

  const classroomIds = classrooms.map((c) => c.id)
  const classroomMap = new Map(
    classrooms.map((c) => {
      const course = Array.isArray(c.courses) ? c.courses[0] : c.courses
      return [c.id, { code: course?.course_code ?? "—", name: course?.name ?? "—", section: c.section }]
    })
  )

  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select("id, classroom_id, students!inner(student_id, section, users!inner(name)), grades(grade, remarks)")
    .in("classroom_id", classroomIds)
    .eq("status", "enrolled")
    .order("created_at")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (enrollments ?? []).map((e) => {
    const student = Array.isArray(e.students) ? e.students[0] : e.students
    const grade = Array.isArray(e.grades) ? e.grades[0] : e.grades
    const user = student ? (Array.isArray(student.users) ? student.users[0] : student.users) : null
    const classroom = classroomMap.get(e.classroom_id)
    return {
      enrollmentId: e.id,
      studentId: student?.student_id ?? "—",
      studentName: user?.name ?? "—",
      section: classroom?.section ?? "—",
      courseCode: classroom?.code ?? "—",
      courseName: classroom?.name ?? "—",
      grade: grade?.grade ?? null,
      remarks: grade?.remarks ?? null,
    }
  })

  return NextResponse.json(rows)
}
