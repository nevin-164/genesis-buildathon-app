CREATE TYPE "public"."application_source" AS ENUM('company_website', 'email', 'referral', 'linkedin', 'job_portal', 'college', 'other');--> statement-breakpoint
CREATE TYPE "public"."assignment_source" AS ENUM('direct', 'class', 'manual');--> statement-breakpoint
CREATE TYPE "public"."internship_status" AS ENUM('draft', 'submitted', 'changes_requested', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."mentor_frequency" AS ENUM('daily', 'weekly', 'occasional', 'never');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'faculty', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_action" AS ENUM('verify', 'request_changes', 'reject', 'respond');--> statement-breakpoint
CREATE TYPE "public"."work_mode" AS ENUM('remote', 'hybrid', 'onsite');--> statement-breakpoint
CREATE TYPE "public"."work_nature" AS ENUM('training_only', 'guided_project', 'real_work');--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"rotated_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"name" text NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"name" text NOT NULL,
	"advisor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"register_number" text NOT NULL,
	"class_id" uuid,
	"advisor_override_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"assigned_faculty_id" uuid,
	"assignment_source" "assignment_source",
	"status" "internship_status" DEFAULT 'draft' NOT NULL,
	"role_title" text NOT NULL,
	"domain" text NOT NULL,
	"work_mode" "work_mode" NOT NULL,
	"location" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"duration_weeks" integer NOT NULL,
	"fee_amount" integer,
	"stipend_amount" integer,
	"work_nature" "work_nature" NOT NULL,
	"project_title" text,
	"work_summary" text NOT NULL,
	"had_mentor" boolean DEFAULT false NOT NULL,
	"mentor_frequency" "mentor_frequency",
	"skills_before" text[],
	"skills_after" text[],
	"technologies" text[],
	"application_source" "application_source",
	"application_process" text,
	"beginner_friendly" boolean,
	"suits_whom" text,
	"submitted_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"internship_id" uuid NOT NULL,
	"doc_type" text NOT NULL,
	"storage_path" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"internship_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" "verification_action" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_events_reason_ck" CHECK ("verification_events"."action" = 'verify' or length(btrim("verification_events"."reason")) >= 10)
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_advisor_override_id_users_id_fk" FOREIGN KEY ("advisor_override_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_assigned_faculty_id_users_id_fk" FOREIGN KEY ("assigned_faculty_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_internship_id_internships_id_fk" FOREIGN KEY ("internship_id") REFERENCES "public"."internships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_events" ADD CONSTRAINT "verification_events_internship_id_internships_id_fk" FOREIGN KEY ("internship_id") REFERENCES "public"."internships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_events" ADD CONSTRAINT "verification_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_hash_key" ON "auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_family_idx" ON "auth_sessions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "batches_department_name_key" ON "batches" USING btree ("department_id","name");--> statement-breakpoint
CREATE INDEX "batches_department_idx" ON "batches" USING btree ("department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "classes_batch_name_key" ON "classes" USING btree ("batch_id","name");--> statement-breakpoint
CREATE INDEX "classes_batch_idx" ON "classes" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "classes_advisor_idx" ON "classes" USING btree ("advisor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_code_key" ON "departments" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "student_profiles_register_number_key" ON "student_profiles" USING btree ("register_number");--> statement-breakpoint
CREATE INDEX "student_profiles_class_idx" ON "student_profiles" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "student_profiles_advisor_override_idx" ON "student_profiles" USING btree ("advisor_override_id");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_name_key" ON "companies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "internships_explore_idx" ON "internships" USING btree ("verified_at") WHERE status = 'verified';--> statement-breakpoint
CREATE INDEX "internships_explore_domain_idx" ON "internships" USING btree ("domain") WHERE status = 'verified';--> statement-breakpoint
CREATE INDEX "internships_explore_company_idx" ON "internships" USING btree ("company_id") WHERE status = 'verified';--> statement-breakpoint
CREATE INDEX "internships_faculty_idx" ON "internships" USING btree ("assigned_faculty_id","status");--> statement-breakpoint
CREATE INDEX "internships_student_idx" ON "internships" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "documents_internship_idx" ON "documents" USING btree ("internship_id");--> statement-breakpoint
CREATE INDEX "verification_events_internship_idx" ON "verification_events" USING btree ("internship_id","created_at");