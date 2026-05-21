import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import type { SemesterStatus } from "@/types"

const VALID_TRANSITIONS: Record<SemesterStatus, SemesterStatus | null> = {
  draft: "pre_enrollment",
  pre_enrollment: "active",
  active: "ended",
  ended: null,
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { status } = await request.json() as { status: SemesterStatus }

  const supabase = await getSupabaseServerClient()

  const { data: existing, error: fetchError } = await supabase
    .from("semesters")
    .select("id, status")
    .eq("id", id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Semester not found" }, { status: 404 })
  }

  const allowedNext = VALID_TRANSITIONS[existing.status as SemesterStatus]
  if (status !== allowedNext) {
    return NextResponse.json(
      { error: `Cannot transition from "${existing.status}" to "${status}"` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("semesters")
    .update({ status })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidateTag("semesters")
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const { data: existing, error: fetchError } = await supabase
    .from("semesters")
    .select("id, status")
    .eq("id", id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Semester not found" }, { status: 404 })
  }

  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft semesters can be deleted" },
      { status: 400 }
    )
  }

  const { error } = await supabase.from("semesters").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidateTag("semesters")
  return NextResponse.json({ success: true })
}
