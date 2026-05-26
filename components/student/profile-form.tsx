"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

type Props = {
  userId: string
  name: string
  studentId: string
  initialEmail: string
  initialContact: string
}

export function StudentProfileForm({
  name,
  studentId,
  initialEmail,
  initialContact,
}: Props) {
  const [email, setEmail] = useState(initialEmail)
  const [contact, setContact] = useState(initialContact)
  const [loading, setLoading] = useState(false)

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contact_number: contact }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Profile updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Student ID</Label>
              <Input value={studentId} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-contact">Contact Number</Label>
              <Input
                id="student-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. 09123456789"
              />
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
