import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const { data: target, error: fetchError } = await supabase
    .from("academic_years")
    .select("id, status")
    .eq("id", id)
    .single()

  if (fetchError || !target) {
    return NextResponse.json({ error: "Academic year not found" }, { status: 404 })
  }

  if (target.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft years can be opened for pre-enrollment" },
      { status: 400 }
    )
  }

  // Check no upcoming year already exists (DB partial index also enforces this)
  const { data: existingUpcoming } = await supabase
    .from("academic_years")
    .select("id")
    .eq("status", "upcoming")
    .single()

  if (existingUpcoming) {
    return NextResponse.json(
      { error: "An upcoming academic year already exists. Activate it first." },
      { status: 409 }
    )
  }

  const { error: updateError } = await supabase
    .from("academic_years")
    .update({ status: "upcoming" })
    .eq("id", id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  revalidateTag("academic-years")
  return NextResponse.json({ ok: true })
}
