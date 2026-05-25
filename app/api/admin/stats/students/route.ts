import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

type ProgramShape = {
  id: string
  name: string
  code: string
  departments: {
    id: string
    name: string
    colleges: { id: string; name: string } | { id: string; name: string }[] | null
  } | {
    id: string
    name: string
    colleges: { id: string; name: string } | { id: string; name: string }[] | null
  }[] | null
}

type StudentShape = {
  id: string
  year_level: number
  programs: ProgramShape | ProgramShape[] | null
}

type EnrollmentRow = {
  student_id: string
  students: StudentShape | StudentShape[] | null
}

export async function GET(request: NextRequest) {
  const yearId = new URL(request.url).searchParams.get("yearId")
  if (!yearId) return NextResponse.json({ error: "yearId is required" }, { status: 400 })

  const supabase = await getSupabaseServerClient()

  // Step 1: get all classroom IDs for this academic year
  const { data: classrooms, error: classroomsError } = await supabase
    .from("classrooms")
    .select("id")
    .eq("academic_year_id", yearId)

  if (classroomsError) {
    return NextResponse.json({ error: classroomsError.message }, { status: 500 })
  }

  const classroomIds = (classrooms ?? []).map((c) => c.id)

  if (classroomIds.length === 0) {
    return NextResponse.json({
      by_college: [],
      by_department: [],
      by_program: [],
      by_year_level: [],
    })
  }

  // Step 2: enrollments in those classrooms with full student→program→dept→college chain
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select(`
      student_id,
      students!inner(
        id, year_level,
        programs!program_id(
          id, name, code,
          departments!department_id(
            id, name,
            colleges!college_id(id, name)
          )
        )
      )
    `)
    .in("classroom_id", classroomIds)
    .in("status", ["enrolled", "pre_enrolled"])

  if (enrollmentsError) {
    return NextResponse.json({ error: enrollmentsError.message }, { status: 500 })
  }

  // Deduplicate by student_id (a student may be enrolled in multiple classrooms)
  const seen = new Set<string>()
  const students: StudentShape[] = []
  for (const row of (enrollments ?? []) as unknown as EnrollmentRow[]) {
    if (seen.has(row.student_id)) continue
    seen.add(row.student_id)
    const s = Array.isArray(row.students) ? row.students[0] : row.students
    if (s) students.push(s)
  }

  // Aggregate helpers
  const collegeMap = new Map<string, { name: string; count: number }>()
  const deptMap = new Map<string, { name: string; college: string; count: number }>()
  const programMap = new Map<string, { name: string; code: string; count: number }>()
  const yearLevelMap = new Map<number, number>()

  for (const s of students) {
    const prog = Array.isArray(s.programs) ? s.programs[0] : s.programs
    const dept = prog ? (Array.isArray(prog.departments) ? prog.departments[0] : prog.departments) : null
    const college = dept ? (Array.isArray(dept.colleges) ? dept.colleges[0] : dept.colleges) : null

    if (college) {
      const entry = collegeMap.get(college.id) ?? { name: college.name, count: 0 }
      entry.count++
      collegeMap.set(college.id, entry)
    }

    if (dept) {
      const entry = deptMap.get(dept.id) ?? { name: dept.name, college: college?.name ?? "", count: 0 }
      entry.count++
      deptMap.set(dept.id, entry)
    }

    if (prog) {
      const entry = programMap.get(prog.id) ?? { name: prog.name, code: prog.code, count: 0 }
      entry.count++
      programMap.set(prog.id, entry)
    }

    const yl = s.year_level ?? 0
    yearLevelMap.set(yl, (yearLevelMap.get(yl) ?? 0) + 1)
  }

  const by_college = Array.from(collegeMap.entries()).map(([id, v]) => ({ id, ...v }))
  const by_department = Array.from(deptMap.entries()).map(([id, v]) => ({ id, ...v }))
  const by_program = Array.from(programMap.entries()).map(([id, v]) => ({ id, ...v }))
  const by_year_level = Array.from(yearLevelMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year_level, count]) => ({ year_level, label: `Year ${year_level}`, count }))

  return NextResponse.json({ by_college, by_department, by_program, by_year_level })
}
