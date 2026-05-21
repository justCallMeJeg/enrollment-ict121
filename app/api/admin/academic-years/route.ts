import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"

const SEMESTER_TERMS = ["1st", "2nd", "midyear"] as const

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("academic_years")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { label } = await request.json()

  if (!label) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  // Only one draft allowed at a time
  const { data: existingDraft } = await supabase
    .from("academic_years")
    .select("id")
    .eq("status", "draft")
    .single()

  if (existingDraft) {
    return NextResponse.json(
      { error: "A draft academic year already exists. Open it for pre-enrollment or delete it first." },
      { status: 409 }
    )
  }

  // Create the new draft year
  const { data: newYear, error: insertError } = await supabase
    .from("academic_years")
    .insert({ label, status: "draft" })
    .select()
    .single()

  if (insertError || !newYear) {
    return NextResponse.json({ error: insertError?.message ?? "Failed to create year" }, { status: 500 })
  }

  // Auto-create 3 semesters for the new academic year
  await supabase.from("semesters").insert(
    SEMESTER_TERMS.map((term) => ({
      academic_year_id: newYear.id,
      term,
      status: "draft",
    }))
  )

  revalidateTag("academic-years")
  revalidateTag("semesters")
  return NextResponse.json(newYear, { status: 201 })
}
