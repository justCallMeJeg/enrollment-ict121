import { AcademicYearCreateForm } from "@/components/admin/academic-year-create-form"
import { PageHeader } from "@/components/shared/page-header"

export default function NewAcademicYearPage() {
  return (
    <div>
      <PageHeader title="New Academic Year" description="Create a new academic year" />
      <AcademicYearCreateForm />
    </div>
  )
}
