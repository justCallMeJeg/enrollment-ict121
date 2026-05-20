import { AcademicYearCreateForm } from "@/components/admin/academic-year-create-form"
import { PageHeader } from "@/components/shared/page-header"

export default function NewAcademicYearPage() {
  return (
    <div>
      <PageHeader
        title="New Academic Year"
        description="Creates a draft academic year with 1st, 2nd, and Midyear semesters ready to configure."
      />
      <AcademicYearCreateForm />
    </div>
  )
}
