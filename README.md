# ISATU Enrollment System

A web-based course enrollment management system for Iloilo Science and Technology University (ISATU). Built for three roles — Admin, Professor, and Student — with a full semester lifecycle from pre-enrollment through grade submission.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Custom JWT (bcrypt + HTTP-only cookies) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Data fetching | SWR (client), Supabase SSR (server) |
| Charts | Recharts |
| Language | TypeScript |

## Features

### Admin
- **Academic year & semester management** — create academic years, manage semesters through a sequential lifecycle: `Draft → Pre-Enrollment → Active → Ended`
- **Classroom management** — add, edit, and delete classrooms per semester; copy classrooms from a previous academic year
- **Student enrollment** — manually add or remove students from classrooms during pre-enrollment
- **Course catalog** — manage courses with program associations, prerequisites, semester terms, year levels, and unit values
- **Academic structure** — manage colleges, departments, and programs
- **User management** — create and manage admin, professor, and student accounts
- **Student distribution charts** — visualize student population by college, department, program, and year level

### Professor
- **Classroom overview** — view all assigned classrooms with enrollment counts and semester info
- **Grade management** — submit grades on the Philippine 1.00–5.00 scale per enrolled student
- **INC declaration** — mark students as Incomplete; grades can be resolved after the semester ends
- **Student drop** — drop students from a classroom

### Student
- **Dashboard** — view current semester courses, grades, units earned, and profile
- **Pre-enrollment** — select courses for the upcoming semester when pre-enrollment is open
- **Course history** — view all past and current enrollments with grades and remarks
- **Profile management** — update personal information and contact details

## Semester Lifecycle

Semesters follow a strict sequential state machine within each academic year:

```
Draft → Pre-Enrollment → Active → Ended
```

- **Draft** — semester is created but not yet open; "Open Pre-Enrollment" is gated behind the previous semester being `Ended`
- **Pre-Enrollment** — students can submit course selections; admins can add/remove students from classrooms
- **Active** — semester is live; professors can enter grades
- **Ended** — semester is closed; grades are locked (except INC resolution)

Semesters within a year are ordered: **1st → 2nd → Midyear**.

## Grading Scale

Philippine grading system (1.00–5.00):

| Grade | Remarks |
|---|---|
| 1.00 – 3.00 | Passed |
| 3.01 – 5.00 | Failed |
| — (null) | Incomplete (INC) |
| — | Dropped |

## Database Schema

```
colleges
  └── departments
        └── programs
              └── courses (many-to-many via course_programs)
                    └── course_prerequisites (self-referential)

academic_years
  └── semesters
        └── classrooms (course + program + professor + section)
              └── enrollments (student ↔ classroom)
                    └── grades
```

Key tables:

| Table | Description |
|---|---|
| `users` | All users with role: `admin`, `professor`, `student` |
| `professors` | Faculty ID linked to a user |
| `students` | Student ID, year level, program, section linked to a user |
| `academic_years` | e.g. "2024-2025" |
| `semesters` | Term (`1st`, `2nd`, `midyear`) + status, belongs to an academic year |
| `classrooms` | A course offered in a semester for a program/section |
| `enrollments` | Student ↔ classroom link with status: `pre_enrolled`, `enrolled`, `dropped` |
| `grades` | Grade (float) and remarks per enrollment |

## Project Structure

```
app/
├── (auth)/login/               # Login page
├── (dashboard)/
│   ├── admin/
│   │   ├── (main)/
│   │   │   ├── [yearId]/               # Year dashboard + charts
│   │   │   │   ├── semesters/          # Semester list with stats
│   │   │   │   ├── courses/            # Year-scoped course offerings
│   │   │   │   └── [semId]/            # Semester overview + classrooms
│   │   │   │       └── classrooms/[classroomId]/  # Classroom detail + enrollment
│   │   │   ├── academic/               # Colleges, departments, programs, courses
│   │   │   └── users/                  # User management
│   │   └── (create)/                   # Academic year creation flow
│   ├── professor/
│   │   ├── classrooms/                 # Classroom grid
│   │   └── classrooms/[classroomId]/   # Student list + grade entry
│   └── student/
│       ├── (main)/                     # Dashboard, courses, grades, profile
│       └── (flow)/pre-enrollment/      # Pre-enrollment flow
├── api/
│   ├── admin/                  # classrooms, courses, enrollments, semesters, students, users...
│   ├── professor/              # classrooms, grades
│   └── student/                # enrollments, pre-enrollment, profile
lib/
├── auth/                       # session.ts, password.ts
├── hooks/                      # SWR hooks (use-classrooms, use-semesters, etc.)
└── supabase/                   # client.ts, server.ts, types.ts
components/
├── admin/                      # Admin-specific components
├── professor/                  # Professor-specific components
├── shared/                     # Reusable UI components
└── layout/                     # Sidebar, nav
supabase/
├── migrations/                 # Schema migration files
└── seed.sql                    # Seed data
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required for local Supabase)
- Supabase CLI (installed as a dev dependency via `npm install`)

### 1. Clone and install

```bash
git clone <repo-url>
cd enrollment
npm install
```

### 2. Start local Supabase

```bash
npx supabase start
```

This starts a local Supabase instance at `http://localhost:54321` with Studio at `http://localhost:54323`.

### 3. Apply schema and seed data

```bash
npx supabase db reset
```

Runs all migration files in `supabase/migrations/` then `supabase/seed.sql` automatically.

### 4. Configure environment variables

Create a `.env.local` file using the keys printed by `supabase start`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
JWT_SECRET=any-random-secret-string
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin@isatu.edu.ph` | `admin123` |
| Professor | `GIM-0000-0` | `professor123` |
| Student 1 | `2023-0172-A` | `student123` |
| Student 2 | `2023-6428-I` | `student123` |
| Student 3 | `2023-7006-A` | `student123` |
| Student 4 | `2023-9204-I` | `student123` |

## Using Supabase Cloud Instead of Local

If you prefer not to run Docker, each developer can use a free Supabase cloud project:

1. Create a project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** and run `supabase/migrations/20260526133025_remote_schema.sql`
3. Then run `supabase/seed.sql`
4. Copy the project URL and keys into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
JWT_SECRET=any-random-secret-string
```

## Syncing Schema and Data from Cloud

If the cloud database has changes not yet in the repo, pull them as a migration:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db pull
```

To export current cloud data as seed:

```bash
npx supabase db dump --data-only -f supabase/seed.sql
```

Commit both files so other developers can run `npx supabase db reset` to get the updated state.

## Available Scripts

```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run typecheck    # TypeScript type check
npm run lint         # ESLint
npm run format       # Prettier (formats all .ts/.tsx files)
```

## Environment Variables Reference

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, never exposed to client) |
| `JWT_SECRET` | Secret used to sign and verify session JWTs |
