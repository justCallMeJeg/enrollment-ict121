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

  // Find the most recent non-draft year to copy courses from
  const { data: sourceYear } = await supabase
    .from("academic_years")
    .select("id")
    .in("status", ["active", "upcoming", "ended"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (sourceYear) {
    const { data: sourceCourses } = await supabase
      .from("courses")
      .select("course_code, name, semester, units, year_level, program_id, prerequisite_course_id")
      .eq("academic_year_id", sourceYear.id)

    if (sourceCourses && sourceCourses.length > 0) {
      // Pass 1: insert all courses without prerequisites; build code -> new_id map
      const pass1Inserts = sourceCourses.map((c) => ({
        academic_year_id: newYear.id,
        program_id: c.program_id,
        professor_id: null,
        course_code: c.course_code,
        name: c.name,
        semester: c.semester,
        units: c.units,
        year_level: c.year_level,
        prerequisite_course_id: null,
      }))

      const { data: inserted } = await supabase
        .from("courses")
        .insert(pass1Inserts)
        .select("id, course_code")

      if (inserted && inserted.length > 0) {
        // Map course_code â†’ new course id within this year
        const codeToNewId = new Map(inserted.map((c) => [c.course_code, c.id]))

        // Pass 2: resolve prerequisites by matching course_code
        const updates: Array<{ newId: string; prereqNewId: string }> = []

        for (const src of sourceCourses) {
          if (!src.prerequisite_course_id) continue

          // Find the prerequisite's course_code from the source year
          const { data: prereqCourse } = await supabase
            .from("courses")
            .select("course_code")
            .eq("id", src.prerequisite_course_id)
            .single()

          if (!prereqCourse) continue

          const prereqNewId = codeToNewId.get(prereqCourse.course_code)
          const newId = codeToNewId.get(src.course_code)
          if (prereqNewId && newId) {
            updates.push({ newId, prereqNewId })
          }
        }

        // Apply prerequisite updates
        await Promise.all(
          updates.map(({ newId, prereqNewId }) =>
            supabase
              .from("courses")
              .update({ prerequisite_course_id: prereqNewId })
              .eq("id", newId)
          )
        )
      }
    }
  }

  // Auto-create 3 semesters for the new academic year
  await supabase.from("semesters").insert(
    SEMESTER_TERMS.map((term) => ({
      academic_year_id: newYear.id,
      term,
      status: "draft",
    }))
  )

  revalidateTag("academic-years", "max")
  revalidateTag("semesters", "max")
  return NextResponse.json(newYear, { status: 201 })
}
