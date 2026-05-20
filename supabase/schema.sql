-- =============================================================================
-- Complete Schema — Enrollment System
-- Run once on a clean Supabase project, then reload the PostgREST schema cache:
--   Dashboard → Project Settings → API → Reload schema cache
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- colleges
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.colleges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  code       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.colleges DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- departments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  name       text NOT NULL,
  code       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (college_id, code)
);
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_departments_college_id ON public.departments (college_id);

-- -----------------------------------------------------------------------------
-- programs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.programs (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id     uuid    NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name              text    NOT NULL,
  code              text    NOT NULL,
  years_to_complete integer NOT NULL DEFAULT 4,
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.programs DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_programs_department_id ON public.programs (department_id);

-- -----------------------------------------------------------------------------
-- users  (custom auth — passwords hashed with bcrypt via pgcrypto)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role           text NOT NULL CHECK (role IN ('admin', 'professor', 'student')),
  name           text NOT NULL,
  email          text NOT NULL UNIQUE,
  password_hash  text NOT NULL,
  contact_number text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- students
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
  user_id    uuid    PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  student_id text    NOT NULL UNIQUE,
  year_level integer NOT NULL DEFAULT 1 CHECK (year_level BETWEEN 1 AND 6),
  program_id uuid    NOT NULL REFERENCES public.programs(id),
  section    text    NOT NULL
);
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_students_program_id ON public.students (program_id);

-- -----------------------------------------------------------------------------
-- professors
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.professors (
  user_id    uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  faculty_id text NOT NULL UNIQUE
);
ALTER TABLE public.professors DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- academic_years
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_years (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label      text NOT NULL UNIQUE,
  status     text NOT NULL DEFAULT 'draft'
             CHECK (status IN ('draft', 'upcoming', 'active', 'ended')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academic_years DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- semesters
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.semesters (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid        NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  term             text        NOT NULL CHECK (term IN ('1st', '2nd', 'midyear')),
  status           text        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'pre_enrollment', 'active', 'ended')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, term)
);
ALTER TABLE public.semesters DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_semesters_academic_year_id ON public.semesters (academic_year_id);

-- -----------------------------------------------------------------------------
-- courses
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id                     uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id       uuid    NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  program_id             uuid    REFERENCES public.programs(id),
  professor_id           uuid    REFERENCES public.users(id),
  course_code            text    NOT NULL,
  name                   text    NOT NULL,
  semester               text    NOT NULL CHECK (semester IN ('1st', '2nd', 'midyear')),
  units                  integer NOT NULL DEFAULT 3,
  year_level             integer NOT NULL DEFAULT 1,
  prerequisite_course_id uuid    REFERENCES public.courses(id),
  created_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, course_code)
);
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_courses_academic_year_id ON public.courses (academic_year_id);
CREATE INDEX IF NOT EXISTS idx_courses_program_id       ON public.courses (program_id);
CREATE INDEX IF NOT EXISTS idx_courses_professor_id     ON public.courses (professor_id);

-- -----------------------------------------------------------------------------
-- pre_enrollments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pre_enrollments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid        NOT NULL REFERENCES public.students(user_id) ON DELETE CASCADE,
  course_id        uuid        NOT NULL REFERENCES public.courses(id)       ON DELETE CASCADE,
  academic_year_id uuid        NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'dropped')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id, academic_year_id)
);
ALTER TABLE public.pre_enrollments DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pre_enrollments_student_id ON public.pre_enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_pre_enrollments_course_id  ON public.pre_enrollments (course_id);

-- -----------------------------------------------------------------------------
-- enrollments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid        NOT NULL REFERENCES public.students(user_id) ON DELETE CASCADE,
  course_id        uuid        NOT NULL REFERENCES public.courses(id)       ON DELETE CASCADE,
  academic_year_id uuid        NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  status           text        NOT NULL DEFAULT 'enrolled'
                               CHECK (status IN ('enrolled', 'dropped')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id, academic_year_id)
);
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id       ON public.enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id        ON public.enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_academic_year_id ON public.enrollments (academic_year_id);

-- -----------------------------------------------------------------------------
-- grades  (1-to-1 with enrollments; created automatically on enrollment)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grades (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid         NOT NULL UNIQUE REFERENCES public.enrollments(id) ON DELETE CASCADE,
  grade         numeric(3,1) CHECK (grade IS NULL OR (grade >= 1.0 AND grade <= 5.0)),
  remarks       text         CHECK (remarks IS NULL OR remarks IN ('Passed', 'Failed', 'Incomplete', 'Dropped')),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);
ALTER TABLE public.grades DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_grades_enrollment_id ON public.grades (enrollment_id);
