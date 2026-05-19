import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { hashPassword } from "@/lib/auth/password"
import { revalidateTag } from "next/cache"

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

  revalidateTag("users", "max")
  revalidateTag("stats", "max")
  return NextResponse.json({ id: user.id }, { status: 201 })
}
