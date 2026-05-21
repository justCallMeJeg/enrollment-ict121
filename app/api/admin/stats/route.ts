import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const yearId = searchParams.get("yearId")

  const supabase = await getSupabaseServerClient()

  const [{ count: students }, { count: professors }, { count: courses }] =
    await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("professors").select("*", { count: "exact", head: true }),
      yearId
        ? supabase
            .from("courses")
            .select("*", { count: "exact", head: true })
            .eq("academic_year_id", yearId)
        : supabase.from("courses").select("*", { count: "exact", head: true }),
    ])

  return NextResponse.json({
    students: students ?? 0,
    professors: professors ?? 0,
    courses: courses ?? 0,
  })
}
