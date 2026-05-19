import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("departments")
    .update(body)
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag("programs")
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from("departments").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag("programs")
  return NextResponse.json({ ok: true })
}
