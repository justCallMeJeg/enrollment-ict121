import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { AcademicYearCreateForm } from "@/components/admin/academic-year-create-form"
import type { PrerequisiteChecks } from "@/components/admin/academic-year-create-form"

export default async function NewAcademicYearPage() {
  await headers()
  const supabase = await getSupabaseServerClient()

  const [
    { count: studentCount },
    { count: professorCount },
    { count: collegeCount },
    { count: departmentCount },
    { count: programCount },
    { count: courseCount },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "professor"),
    supabase.from("colleges").select("*", { count: "exact", head: true }),
    supabase.from("departments").select("*", { count: "exact", head: true }),
    supabase.from("programs").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
  ])

  const checks: PrerequisiteChecks = {
    students: (studentCount ?? 0) >= 1,
    professors: (professorCount ?? 0) >= 1,
    colleges: (collegeCount ?? 0) >= 1,
    departments: (departmentCount ?? 0) >= 1,
    programs: (programCount ?? 0) >= 1,
    courses: (courseCount ?? 0) >= 1,
  }

  return <AcademicYearCreateForm checks={checks} />
}
