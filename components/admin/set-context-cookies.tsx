"use client"

import { useEffect } from "react"

export function SetContextCookies({
  yearId,
  semesterId,
}: {
  yearId?: string
  semesterId?: string
}) {
  useEffect(() => {
    if (yearId) {
      document.cookie = `admin-year-id=${yearId}; path=/; max-age=2592000; SameSite=Lax`
    }
    if (semesterId) {
      document.cookie = `admin-semester-id=${semesterId}; path=/; max-age=2592000; SameSite=Lax`
    }
  }, [yearId, semesterId])

  return null
}
