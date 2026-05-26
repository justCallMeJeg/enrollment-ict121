"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, Calendar, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import Link from "next/link"

export type PrerequisiteChecks = {
  students: boolean
  professors: boolean
  colleges: boolean
  departments: boolean
  programs: boolean
  courses: boolean
}

const PREREQUISITE_ITEMS: { label: string; key: keyof PrerequisiteChecks; href: string }[] = [
  { label: "Student Account", key: "students", href: "/admin/users" },
  { label: "Professor Account", key: "professors", href: "/admin/users" },
  { label: "College", key: "colleges", href: "/admin/academic/colleges" },
  { label: "Department", key: "departments", href: "/admin/academic/departments" },
  { label: "Program", key: "programs", href: "/admin/academic/programs" },
  { label: "Course", key: "courses", href: "/admin/academic/courses" },
]

function deriveLabel(startYear: string): string {
  const sy = parseInt(startYear)
  if (!sy || isNaN(sy)) return ""
  return `${sy}-${sy + 1}`
}

export function AcademicYearCreateForm({ checks }: { checks?: PrerequisiteChecks }) {
  const router = useRouter()
  const [startYear, setStartYear] = useState(String(new Date().getFullYear()))
  const [loading, setLoading] = useState(false)

  const derivedLabel = deriveLabel(startYear)
  const allMet = checks ? Object.values(checks).every(Boolean) : true
  const metCount = checks ? Object.values(checks).filter(Boolean).length : 0
  const totalCount = PREREQUISITE_ITEMS.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!derivedLabel) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: derivedLabel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Academic year ${derivedLabel} created with 3 semesters`)
      router.push(`/admin/${data.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create academic year")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to Dashboard
      </Link>

      {/* Prerequisites checklist */}
      {checks && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Setup Checklist</p>
              <p className="text-xs text-muted-foreground">
                Before creating an academic year, ensure the following are set up.
              </p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              allMet
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}>
              {metCount}/{totalCount}
            </span>
          </div>

          <div className="space-y-2.5">
            {PREREQUISITE_ITEMS.map(({ label, key, href }) => {
              const met = checks[key]
              return (
                <div key={key} className="flex items-center gap-3">
                  {met ? (
                    <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={`text-sm flex-1 ${met ? "text-foreground" : "text-muted-foreground"}`}>
                    At least 1 {label}
                  </span>
                  {!met && (
                    <Link
                      href={href}
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      Set up →
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          {!allMet && (
            <div className="flex items-start gap-2 pt-1 border-t text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
              <span>
                You can still create the academic year, but students won&apos;t be able to
                enroll until all items above are configured.
              </span>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ay-year">
              Start Year <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ay-year"
              type="number"
              min={2000}
              max={2100}
              step={1}
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              placeholder="e.g. 2025"
              required
              className="max-w-[200px]"
            />
            {derivedLabel && (
              <p className="text-xs text-muted-foreground">
                Academic year label:{" "}
                <span className="font-medium text-foreground">{derivedLabel}</span>
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="size-4 text-muted-foreground" />
            Semesters that will be created automatically
          </div>
          <div className="flex flex-wrap gap-2">
            {["1st Semester", "2nd Semester", "Midyear Semester"].map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            All three semesters start as <strong>Draft</strong>. You can open each for
            pre-enrollment individually from the Courses and Academic Year pages.
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading || !derivedLabel}>
            {loading ? "Creating…" : "Create Academic Year"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
