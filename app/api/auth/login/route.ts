import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { verifyPassword } from "@/lib/auth/password"
import { createSession, setSessionCookie } from "@/lib/auth/session"
import type { UserRole } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const { id_number, password } = await request.json()

    if (!id_number || !password) {
      return NextResponse.json(
        { error: "ID number and password are required" },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    let userId: string | null = null
    let role: UserRole | null = null
    let name: string | null = null
    let passwordHash: string | null = null

    // Try student
    const { data: student } = await supabase
      .from("students")
      .select("user_id, users(id, name, password_hash, role)")
      .eq("student_id", id_number)
      .single()

    if (student?.users) {
      const user = Array.isArray(student.users) ? student.users[0] : student.users
      userId = user.id
      role = user.role as UserRole
      name = user.name
      passwordHash = user.password_hash
    }

    // Try professor
    if (!userId) {
      const { data: professor } = await supabase
        .from("professors")
        .select("user_id, users(id, name, password_hash, role)")
        .eq("faculty_id", id_number)
        .single()

      if (professor?.users) {
        const user = Array.isArray(professor.users) ? professor.users[0] : professor.users
        userId = user.id
        role = user.role as UserRole
        name = user.name
        passwordHash = user.password_hash
      }
    }

    // Try admin (admin logs in with email as ID)
    if (!userId) {
      const { data: admin } = await supabase
        .from("users")
        .select("id, name, password_hash, role")
        .eq("email", id_number)
        .eq("role", "admin")
        .single()

      if (admin) {
        userId = admin.id
        role = admin.role as UserRole
        name = admin.name
        passwordHash = admin.password_hash
      }
    }

    if (!userId || !role || !name || !passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await verifyPassword(password, passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await createSession({ userId, role, name })
    await setSessionCookie(token)

    return NextResponse.json({ role })
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
