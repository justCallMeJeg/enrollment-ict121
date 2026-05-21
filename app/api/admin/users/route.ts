import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { hashPassword } from "@/lib/auth/password"
import { revalidateTag } from "next/cache"

export async function GET() {
  const supabase = await getSupabaseServerClient()

  const [{ data: professors }, { data: students }, { data: programs }] =
    await Promise.all([
      supabase
        .from("professors")
        .select("user_id, faculty_id, users(id, name, email, role, contact_number, created_at)")
        .order("faculty_id"),
      supabase
        .from("students")
        .select("user_id, year_level, program_id, section, users(id, name, email, role, contact_number, created_at)")
        .order("user_id"),
      supabase.from("programs").select("id, name, code").order("name"),
    ])

  const users = [
    ...(professors ?? []).map((p) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users
      return { id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at, contact_number: u.contact_number ?? null }
    }),
    ...(students ?? []).map((s) => {
      const u = Array.isArray(s.users) ? s.users[0] : s.users
      return { id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at, contact_number: u.contact_number ?? null, year_level: s.year_level, program_id: s.program_id, section: s.section }
    }),
  ].sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json({ users, programs: programs ?? [] })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    role,
    name,
    id_number,
    email,
    password,
    contact_number,
    year_level,
    program_id,
    section,
  } = body

  if (!role || !name || !id_number || !email || !password) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
  }

  if (role === "student" && (!program_id || !section)) {
    return NextResponse.json(
      { error: "Program and section are required for students" },
      { status: 400 }
    )
  }

  const supabase = await getSupabaseServerClient()
  const password_hash = await hashPassword(password)

  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({ role, name, email, password_hash, contact_number: contact_number || null })
    .select("id")
    .single()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  if (role === "student") {
    const { error } = await supabase.from("students").insert({
      user_id: user.id,
      student_id: id_number,
      year_level: Number(year_level),
      program_id,
      section,
    })
    if (error) {
      await supabase.from("users").delete().eq("id", user.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else if (role === "professor") {
    const { error } = await supabase.from("professors").insert({
      user_id: user.id,
      faculty_id: id_number,
    })
    if (error) {
      await supabase.from("users").delete().eq("id", user.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  revalidateTag("users")
  revalidateTag("stats")
  return NextResponse.json({ id: user.id }, { status: 201 })
}
