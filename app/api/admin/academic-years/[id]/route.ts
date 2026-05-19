import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"

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
  revalidateTag("academic-years")
  return NextResponse.json(data)
}
