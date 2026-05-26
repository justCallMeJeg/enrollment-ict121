import { redirect } from "next/navigation"

export default async function AcademicYearDetailPage({
  params,
}: {
  params: Promise<{ yearId: string }>
}) {
  const { yearId } = await params
  redirect(`/admin/${yearId}`)
}
