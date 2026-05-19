export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: "admin" | "professor" | "student"
          name: string
          email: string
          password_hash: string
          contact_number: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>
      }
      students: {
        Row: {
          user_id: string
          student_id: string
          year_level: number
          program_id: string
          section: string
        }
        Insert: Database["public"]["Tables"]["students"]["Row"]
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>
      }
      professors: {
        Row: {
          user_id: string
          faculty_id: string
        }
        Insert: Database["public"]["Tables"]["professors"]["Row"]
        Update: Partial<Database["public"]["Tables"]["professors"]["Insert"]>
      }
      colleges: {
        Row: {
          id: string
          name: string
          code: string
        }
        Insert: Omit<Database["public"]["Tables"]["colleges"]["Row"], "id"> & { id?: string }
        Update: Partial<Database["public"]["Tables"]["colleges"]["Insert"]>
      }
      departments: {
        Row: {
          id: string
          college_id: string
          name: string
          code: string
        }
        Insert: Omit<Database["public"]["Tables"]["departments"]["Row"], "id"> & { id?: string }
        Update: Partial<Database["public"]["Tables"]["departments"]["Insert"]>
      }
      programs: {
        Row: {
          id: string
          department_id: string
          name: string
          code: string
          years_to_complete: number
        }
        Insert: Omit<Database["public"]["Tables"]["programs"]["Row"], "id"> & { id?: string }
        Update: Partial<Database["public"]["Tables"]["programs"]["Insert"]>
      }
      courses: {
        Row: {
          id: string
          academic_year_id: string
          program_id: string
          professor_id: string | null
          course_code: string
          name: string
          semester: "1st" | "2nd" | "summer"
          units: number
          year_level: number
          prerequisite_course_id: string | null
        }
        Insert: Omit<Database["public"]["Tables"]["courses"]["Row"], "id"> & { id?: string }
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>
      }
      academic_years: {
        Row: {
          id: string
          label: string
          status: "draft" | "upcoming" | "active" | "ended"
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["academic_years"]["Row"], "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["academic_years"]["Insert"]>
      }
      pre_enrollments: {
        Row: {
          id: string
          student_id: string
          course_id: string
          academic_year_id: string
          status: "pending" | "dropped"
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["pre_enrollments"]["Row"], "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["pre_enrollments"]["Insert"]>
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          course_id: string
          academic_year_id: string
          status: "enrolled" | "dropped"
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["enrollments"]["Row"], "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["enrollments"]["Insert"]>
      }
      grades: {
        Row: {
          id: string
          enrollment_id: string
          grade: number | null
          remarks: "Passed" | "Failed" | "Incomplete" | "Dropped" | null
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["grades"]["Row"], "id" | "updated_at"> & {
          id?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["grades"]["Insert"]>
      }
    }
  }
}
