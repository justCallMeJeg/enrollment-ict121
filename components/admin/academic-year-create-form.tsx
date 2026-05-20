"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"

function deriveLabel(startYear: string): string {
  const sy = parseInt(startYear)
  if (!sy || isNaN(sy)) return ""
  return `${sy}-${sy + 1}`
}

export function AcademicYearCreateForm() {
  const router = useRouter()
  const [startYear, setStartYear] = useState(String(new Date().getFullYear()))
  const [loading, setLoading] = useState(false)

  const derivedLabel = deriveLabel(startYear)

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

      // Set the new year as active context
      document.cookie = `admin-year-id=${data.id}; path=/; max-age=2592000; SameSite=Lax`
      document.cookie = `admin-semester-id=; path=/; max-age=0; SameSite=Lax`

      toast.success(`Academic year ${derivedLabel} created with 3 semesters`)
      router.push("/admin")
      router.refresh()
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
