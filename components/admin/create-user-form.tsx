"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Combobox } from "@/components/shared/combobox"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { Program } from "@/types"

type Props = {
  programs: Pick<Program, "id" | "name" | "code">[]
}

export function CreateUserForm({ programs }: Props) {
  const router = useRouter()
  const [role, setRole] = useState<"student" | "professor">("student")
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    id_number: "",
    email: "",
    password: "",
    contact_number: "",
    year_level: "1",
    program_id: "",
    section: "",
  })

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleProgramChange(programId: string) {
    set("program_id", programId)
    set("section", "")
  }

  const selectedProgram = programs.find((p) => p.id === form.program_id)
  const sectionPrefix = selectedProgram
    ? `${selectedProgram.code}-${form.year_level}`
    : ""

  function handleSectionChange(val: string) {
    set("section", val)
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("User account created")
      setForm({
        name: "",
        id_number: "",
        email: "",
        password: "",
        contact_number: "",
        year_level: "1",
        program_id: "",
        section: "",
      })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create User Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "student" | "professor")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_number">
                {role === "student" ? "Student ID" : "Faculty ID"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="id_number"
                value={form.id_number}
                onChange={(e) => set("id_number", e.target.value)}
                placeholder={role === "student" ? "2024-00001" : "FAC-2024-001"}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_number">Contact Number</Label>
              <Input
                id="contact_number"
                value={form.contact_number}
                onChange={(e) => set("contact_number", e.target.value)}
              />
            </div>
          </div>

          {role === "student" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Year Level <span className="text-destructive">*</span></Label>
                <Select
                  value={form.year_level}
                  onValueChange={(v) => set("year_level", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {[1, 2, 3, 4, 5, 6].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        Year {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Program <span className="text-destructive">*</span></Label>
                <Combobox
                  options={programs.map((p) => ({ value: p.id, label: p.name, code: p.code }))}
                  value={form.program_id}
                  onValueChange={handleProgramChange}
                  placeholder="Select program"
                  searchPlaceholder="Search programs…"
                  emptyText="No programs found."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section <span className="text-destructive">*</span></Label>
                {sectionPrefix ? (
                  <InputGroup className="h-9">
                    <InputGroupAddon>
                      <InputGroupText className="font-mono text-xs">
                        {sectionPrefix}-
                      </InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="section"
                      value={form.section}
                      onChange={(e) => handleSectionChange(e.target.value.toUpperCase())}
                      placeholder="e.g. A"
                      required={role === "student"}
                    />
                  </InputGroup>
                ) : (
                  <Input
                    id="section"
                    value={form.section}
                    onChange={(e) => set("section", e.target.value)}
                    placeholder="Select a program first"
                    required={role === "student"}
                  />
                )}
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
