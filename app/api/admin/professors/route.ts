import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("professors")
    .select("user_id, faculty_id, users(name)")
    .order("faculty_id")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
