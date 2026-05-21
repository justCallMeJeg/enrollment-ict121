import { redirect } from "next/navigation"

export default async function SemesterDetailPage({
  params,
}: {
  params: Promise<{ yearId: string; semId: string }>
}) {
  const { yearId, semId } = await params
  redirect(`/admin/${yearId}/${semId}`)
}
