"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/shared/combobox"
import { DataTable } from "@/components/shared/data-table"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { FormModal } from "@/components/shared/form-modal"
import { TableToolbar } from "@/components/shared/table-toolbar"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { IconButton } from "@/components/shared/icon-button"
import { toast } from "sonner"
import type { Program } from "@/types"

export type UserRow = {
  id: string
  name: string
  email: string
  role: string
  created_at: string
  contact_number: string | null
  year_level?: number | null
  program_id?: string | null
  section?: string | null
}

const INIT_FORM = {
  name: "",
  id_number: "",
  email: "",
  password: "",
  contact_number: "",
  year_level: "1",
  program_id: "",
  section: "",
}

export function UserManager({
  users,
  programs,
}: {
  users: UserRow[]
  programs: Pick<Program, "id" | "name" | "code">[]
}) {
  const router = useRouter()
  const [role, setRole] = useState<"student" | "professor">("student")
  const [form, setForm] = useState(INIT_FORM)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UserRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<string[]>([])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search.trim() ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchesRole = filterRole.length === 0 || filterRole.includes(u.role)
      return matchesSearch && matchesRole
    })
  }, [users, search, filterRole])

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleProgramChange(programId: string) {
    set("program_id", programId)
    if (!editTarget) set("section", "")
  }

  const selectedProgram = programs.find((p) => p.id === form.program_id)
  const sectionPrefix =
    role === "student" && selectedProgram
      ? `${selectedProgram.code}-${form.year_level}`
      : ""

  function handleSectionChange(val: string) {
    set("section", val)
  }

  function openCreate() {
    setForm(INIT_FORM)
    setRole("student")
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(user: UserRow) {
    setForm({
      name: user.name,
      id_number: "",
      email: user.email,
      password: "",
      contact_number: user.contact_number ?? "",
      year_level: String(user.year_level ?? 1),
      program_id: user.program_id ?? "",
      section: user.section ?? "",
    })
    setRole(user.role as "student" | "professor")
    setEditTarget(user)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
    setForm(INIT_FORM)
    setRole("student")
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    try {
      if (editTarget) {
        const res = await fetch(`/api/admin/users/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, role }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success("User updated")
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, role }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success("User account created")
      }
      closeModal()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save user")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("User account deleted")
      setDeleteTarget(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setDeleting(false)
    }
  }

  const hasFilters = search || filterRole.length > 0

  return (
    <div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users…"
        filters={[
          {
            key: "role",
            label: "Role",
            options: [
              { label: "Student", value: "student" },
              { label: "Professor", value: "professor" },
            ],
            selected: filterRole,
            onApply: setFilterRole,
          },
        ]}
        resultCount={filtered.length}
        totalCount={users.length}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            Add User
          </Button>
        }
      />

      <DataTable
        keyField="id"
        data={filtered as unknown as Record<string, unknown>[]}
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          {
            key: "role",
            header: "Role",
            render: (row) => {
              const u = row as unknown as UserRow
              return (
                <Badge variant="outline" className="capitalize">
                  {u.role}
                </Badge>
              )
            },
          },
          {
            key: "actions",
            header: "",
            render: (row) => {
              const u = row as unknown as UserRow
              return (
                <div className="flex gap-1 justify-end">
                  <IconButton tooltip="Edit" className="hover:text-foreground" onClick={() => openEdit(u)}>
                    <Pencil className="size-3.5" />
                  </IconButton>
                  <IconButton tooltip="Delete account" className="hover:text-destructive" onClick={() => setDeleteTarget(u)}>
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              )
            },
          },
        ]}
        emptyTitle={hasFilters ? "No users match your filters" : "No users yet"}
        emptyDescription={hasFilters ? "Try adjusting your search or filter" : "Create the first user account using the button above"}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(o) => { if (!o) closeModal(); else setModalOpen(true) }}
        title={editTarget ? "Edit User" : "Create User Account"}
        onSubmit={handleSubmit}
        submitLabel={editTarget ? "Save Changes" : "Create Account"}
        loading={loading}
        size="lg"
      >
        {/* Role row */}
        <div className="space-y-2">
          <Label>Role <span className="text-destructive">*</span></Label>
          {editTarget ? (
            <div className="flex h-9 items-center px-3 rounded-md border bg-muted text-sm capitalize text-muted-foreground">
              {role}
            </div>
          ) : (
            <Select value={role} onValueChange={(v) => setRole(v as "student" | "professor")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="professor">Professor</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Name + ID (create) or Name full-width (edit) */}
        {!editTarget ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="um-name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="um-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="um-id">{role === "student" ? "Student ID" : "Faculty ID"} <span className="text-destructive">*</span></Label>
              <Input
                id="um-id"
                value={form.id_number}
                onChange={(e) => set("id_number", e.target.value)}
                placeholder={role === "student" ? "2024-00001" : "FAC-2024-001"}
                required
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="um-name">Full Name <span className="text-destructive">*</span></Label>
            <Input
              id="um-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
        )}

        {/* Email + Password */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="um-email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="um-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="um-password">
              {editTarget ? "Password (optional)" : <>Password <span className="text-destructive">*</span></>}
            </Label>
            <Input
              id="um-password"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required={!editTarget}
              minLength={editTarget ? undefined : 8}
              placeholder={editTarget ? "Leave blank to keep current" : undefined}
            />
          </div>
        </div>

        {/* Contact Number */}
        <div className="space-y-2">
          <Label htmlFor="um-contact">Contact Number</Label>
          <Input
            id="um-contact"
            value={form.contact_number}
            onChange={(e) => set("contact_number", e.target.value)}
            placeholder="e.g. 09123456789"
          />
        </div>

        {/* Student-only fields */}
        {role === "student" && (
          <>
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Year Level <span className="text-destructive">*</span></Label>
                <Select value={form.year_level} onValueChange={(v) => set("year_level", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {[1, 2, 3, 4, 5, 6].map((y) => (
                      <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="um-section">Section <span className="text-destructive">*</span></Label>
              {sectionPrefix ? (
                <InputGroup className="h-9">
                  <InputGroupAddon>
                    <InputGroupText className="font-mono text-xs">
                      {sectionPrefix}-
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="um-section"
                    value={form.section}
                    onChange={(e) => handleSectionChange(e.target.value.toUpperCase())}
                    placeholder="e.g. A"
                    required
                  />
                </InputGroup>
              ) : (
                <Input
                  id="um-section"
                  value={form.section}
                  onChange={(e) => set("section", e.target.value)}
                  placeholder="Select a program first"
                  required
                />
              )}
            </div>
          </>
        )}
      </FormModal>

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete User Account"
        description={`Are you sure you want to delete ${deleteTarget?.name ?? "this user"}? All their enrollments and grades will also be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
