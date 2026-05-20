export type UserRole = "admin" | "professor" | "student"

export type SemesterTerm = "1st" | "2nd" | "midyear"

export type SemesterStatus = "draft" | "pre_enrollment" | "active" | "ended"

export type Semester = {
  id: string
  academic_year_id: string
  term: SemesterTerm
  status: SemesterStatus
  created_at: string
}

export type AdminSemesterContext = {
  id: string
  academic_year_id: string
  term: SemesterTerm
  status: SemesterStatus
}

export function semesterLabel(term: SemesterTerm): string {
  if (term === "midyear") return "Midyear Semester"
  return `${term} Semester`
}

export type SessionPayload = {
  userId: string
  role: UserRole
  name: string
}

export type User = {
  id: string
  role: UserRole
  name: string
  email: string
  contact_number: string | null
  created_at: string
}

export type Student = {
  user_id: string
  student_id: string
  year_level: number
  program_id: string
  section: string
  users: User
  programs?: Program
}

export type Professor = {
  user_id: string
  faculty_id: string
  users: User
}

export type College = {
  id: string
  name: string
  code: string
}

export type Department = {
  id: string
  college_id: string
  name: string
  code: string
  colleges?: College
}

export type Program = {
  id: string
  department_id: string
  name: string
  code: string
  years_to_complete: number
  departments?: Department
}

export type Course = {
  id: string
  academic_year_id: string
  program_id: string
  professor_id: string | null
  course_code: string
  name: string
  semester: SemesterTerm
  units: number
  year_level: number
  prerequisite_course_id: string | null
  programs?: Program
  professors?: Professor
  prerequisite?: Course | null
}

export type AcademicYearStatus = "draft" | "upcoming" | "active" | "ended"

export type AdminYearContext = {
  id: string
  label: string
  status: AcademicYearStatus
}

export type AcademicYear = {
  id: string
  label: string
  status: AcademicYearStatus
  start_date: string | null
  end_date: string | null
  created_at: string
}

export type PreEnrollmentStatus = "pending" | "dropped"

export type PreEnrollment = {
  id: string
  student_id: string
  course_id: string
  academic_year_id: string
  status: PreEnrollmentStatus
  created_at: string
  courses?: Course
  students?: Student
  academic_years?: AcademicYear
}

export type EnrollmentStatus = "enrolled" | "dropped"

export type Enrollment = {
  id: string
  student_id: string
  course_id: string
  academic_year_id: string
  status: EnrollmentStatus
  created_at: string
  courses?: Course
  students?: Student
  academic_years?: AcademicYear
  grades?: Grade | null
}

export type Grade = {
  id: string
  enrollment_id: string
  grade: number | null
  remarks: "Passed" | "Failed" | "Incomplete" | "Dropped" | null
  updated_at: string
}

export type CourseWithEligibility = Course & {
  eligible: boolean
  pre_enrolled: boolean
}
