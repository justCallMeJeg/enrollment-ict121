import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { hashPassword } from "@/lib/auth/password"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { name, email, contact_number, password, role, year_level, program_id, section } =
    await request.json()

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  const userUpdate: Record<string, unknown> = {
    name,
    email,
    contact_number: contact_number || null,
  }
  if (password) {
    userUpdate.password_hash = await hashPassword(password)
  }

  const { error: userError } = await supabase
    .from("users")
    .update(userUpdate)
    .eq("id", id)

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

  if (role === "student") {
    if (!program_id || !section) {
      return NextResponse.json(
        { error: "Program and section are required for students" },
        { status: 400 }
      )
    }
    const { error: studentError } = await supabase
      .from("students")
      .update({ year_level: Number(year_level), program_id, section })
      .eq("user_id", id)
    if (studentError) return NextResponse.json({ error: studentError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
