import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { hashPassword } from "@/lib/auth/password"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const currentUserId = request.headers.get("x-user-id")

  if (id === currentUserId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("role")
    .eq("id", id)
    .single()

  if (fetchError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (user.role === "admin") {
    return NextResponse.json({ error: "Admin accounts cannot be deleted" }, { status: 403 })
  }

  const { error } = await supabase.from("users").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

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
