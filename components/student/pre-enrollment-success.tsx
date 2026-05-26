"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const REDIRECT_SECONDS = 5

export function PreEnrollmentSuccessRedirect() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (countdown === 0) router.push("/student")
  }, [countdown, router])

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <Button asChild size="sm">
        <Link href="/student">Go to Dashboard</Link>
      </Button>
      <p className="text-sm text-muted-foreground">
        Redirecting in {countdown}s…
      </p>
    </div>
  )
}
