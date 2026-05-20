import { getAdminYearContext } from "@/lib/admin-year"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { semesterLabel } from "@/types"

export default async function ClassroomsPage() {
  const { year, semester } = await getAdminYearContext()

  if (!year || !semester) {
    return (
      <div>
        <PageHeader title="Classrooms" description="Course section and professor assignments" />
        <EmptyState
          title="No semester selected"
          description="Navigate to an academic year and select a semester to manage classrooms."
        />
      </div>
    )
  }

  const semLabel = semesterLabel(semester.term)

  return (
    <div>
      <PageHeader
        title="Classrooms"
        description={`Course assignments for ${year.label} — ${semLabel}`}
      />
      <EmptyState
        title="Coming soon"
        description="The classroom assignment feature is currently being designed. It will allow you to assign professors to student sections for each course."
      />
    </div>
  )
}
