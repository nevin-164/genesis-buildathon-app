-- Advisor routing invariants.
--
--   1. every class has a faculty advisor        (classes.advisor_id NOT NULL)
--   2. every student is in a class              (student_profiles.class_id NOT NULL)
--   3. every non-draft internship has a reviewer (CHECK on internships)
--
-- Together these make "submitted with nobody to verify it" unrepresentable,
-- which is why the admin repair queue that used to handle it is gone.
--
-- The four DO blocks below are the backfill. They have to run BEFORE the
-- constraints, because SET NOT NULL is validated against existing rows and any
-- one leftover NULL aborts the whole migration. Each block reports what it
-- touched with RAISE NOTICE, so the run log is the record of what moved.
--
-- Backfilled rows are a guess, not a decision. Review them afterwards at
-- /admin/classes and /admin/users?role=student.

-- 1 · classes with no advisor get the longest-standing active faculty account.
--     Deterministic (created_at, then id) so a re-run lands the same way.
DO $$
DECLARE
  fallback_faculty uuid;
  touched integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM classes WHERE advisor_id IS NULL) THEN
    RETURN;
  END IF;

  SELECT id INTO fallback_faculty
  FROM users
  WHERE role = 'faculty' AND is_active
  ORDER BY created_at, id
  LIMIT 1;

  IF fallback_faculty IS NULL THEN
    RAISE EXCEPTION
      'Cannot backfill classes.advisor_id: there is no active faculty account. Register one at /register (choose Faculty), then re-run this migration.';
  END IF;

  UPDATE classes SET advisor_id = fallback_faculty WHERE advisor_id IS NULL;
  GET DIAGNOSTICS touched = ROW_COUNT;
  RAISE NOTICE 'backfilled advisor_id on % class(es) -> %', touched, fallback_faculty;
END $$;
--> statement-breakpoint

-- 2 · a live advisor_override_id was the student's real reviewer. Preserve that
--     intent by moving them into a class that advisor already runs, before the
--     column is dropped. Students whose override matched their class advisor
--     anyway are untouched.
DO $$
DECLARE
  touched integer;
BEGIN
  UPDATE student_profiles sp
  SET class_id = (
    SELECT c.id FROM classes c
    WHERE c.advisor_id = sp.advisor_override_id
    ORDER BY c.created_at, c.id
    LIMIT 1
  )
  WHERE sp.advisor_override_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM classes c WHERE c.advisor_id = sp.advisor_override_id)
    AND (
      sp.class_id IS NULL
      OR sp.class_id <> (
        SELECT c.id FROM classes c
        WHERE c.advisor_id = sp.advisor_override_id
        ORDER BY c.created_at, c.id
        LIMIT 1
      )
    );

  GET DIAGNOSTICS touched = ROW_COUNT;
  IF touched > 0 THEN
    RAISE NOTICE 'moved % student(s) into a class run by their former override advisor', touched;
  END IF;
END $$;
--> statement-breakpoint

-- 3 · students still without a class go to the oldest class. Arbitrary, and
--     deliberately noisy about it — an admin has to move them somewhere real.
DO $$
DECLARE
  fallback_class uuid;
  touched integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM student_profiles WHERE class_id IS NULL) THEN
    RETURN;
  END IF;

  SELECT id INTO fallback_class FROM classes ORDER BY created_at, id LIMIT 1;

  IF fallback_class IS NULL THEN
    RAISE EXCEPTION
      'Cannot backfill student_profiles.class_id: there are no classes. Build the tree at /admin/departments first, or drop these student rows.';
  END IF;

  UPDATE student_profiles SET class_id = fallback_class WHERE class_id IS NULL;
  GET DIAGNOSTICS touched = ROW_COUNT;
  RAISE NOTICE
    'placed % student(s) with no class into % - REVIEW THIS at /admin/users?role=student',
    touched, fallback_class;
END $$;
--> statement-breakpoint

-- 4 · internships that were submitted with no reviewer. Every student now has a
--     class and every class an advisor, so the routing that failed at submit
--     time resolves. Written as 'manual' because it is an after-the-fact
--     administrative fill, which is exactly what that source means.
DO $$
DECLARE
  touched integer;
BEGIN
  UPDATE internships i
  SET assigned_faculty_id = c.advisor_id,
      assignment_source = 'manual',
      updated_at = now()
  FROM student_profiles sp
  JOIN classes c ON c.id = sp.class_id
  WHERE sp.user_id = i.student_id
    AND i.status <> 'draft'
    AND i.assigned_faculty_id IS NULL;

  GET DIAGNOSTICS touched = ROW_COUNT;
  IF touched > 0 THEN
    RAISE NOTICE 'assigned a reviewer to % previously unassigned internship(s)', touched;
  END IF;
END $$;
--> statement-breakpoint

ALTER TABLE "classes" DROP CONSTRAINT "classes_advisor_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "student_profiles" DROP CONSTRAINT "student_profiles_advisor_override_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "student_profiles" DROP CONSTRAINT "student_profiles_class_id_classes_id_fk";
--> statement-breakpoint
DROP INDEX "student_profiles_advisor_override_idx";--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "advisor_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "student_profiles" ALTER COLUMN "class_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" DROP COLUMN "advisor_override_id";--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_assigned_when_submitted_ck" CHECK ("internships"."status" = 'draft' or "internships"."assigned_faculty_id" is not null);
