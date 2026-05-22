import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  // Guard: only draft years may be deleted
  const { data: year } = await supabase
    .from("academic_years")
    .select("status")
    .eq("id", id)
    .single()

  if (!year) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (year.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft academic years can be deleted" },
      { status: 400 }
    )
  }

  const { error } = await supabase.from("academic_years").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { label } = await request.json()
  if (!label) return NextResponse.json({ error: "Label is required" }, { status: 400 })
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("academic_years")
    .update({ label })
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
