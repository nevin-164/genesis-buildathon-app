create type user_role as enum ('student', 'faculty', 'admin');
create type contact_preference as enum (
  'no_contact', 'written_questions', 'limited_questions',
  'mentorship', 'internship_season'
);
create type experience_status as enum (
  'draft', 'pending', 'verified', 'rejected', 'needs_correction'
);
create type work_mode as enum ('remote', 'hybrid', 'offline');
create type work_type as enum ('real_company_work', 'guided_project', 'training_only');
create type project_type as enum ('individual', 'group', 'common');
create type mentor_frequency as enum ('daily', 'weekly', 'rarely', 'never');
create type application_channel as enum (
  'company_website', 'email', 'referral', 'linkedin',
  'college', 'direct_registration', 'other'
);
create type evidence_type as enum (
  'certificate', 'offer_letter', 'completion_letter',
  'report', 'screenshot', 'github', 'video', 'other'
);
create type evidence_visibility as enum ('faculty_only', 'public');
create type verification_action as enum ('approved', 'rejected', 'correction_requested');
create type asset_type as enum (
  'report_draft', 'resume_points', 'viva_questions',
  'linkedin_summary', 'portfolio_entry'
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role user_role not null default 'student',
  branch text,
  year_of_study int check (year_of_study between 1 and 4),
  admission_year int,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  contact_preference contact_preference not null default 'written_questions',
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  website text,
  domains text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table experiences (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references profiles (id) on delete cascade,
  company_id uuid not null references companies (id),
  status experience_status not null default 'draft',

  role_title text not null,
  domain text not null,
  location text,
  mode work_mode not null,
  duration_weeks int,
  year_completed int,

  paid_fee boolean not null default false,
  fee_amount numeric,
  stipend_received boolean not null default false,
  stipend_amount numeric,
  extra_charges text,

  work_type work_type,
  project_type project_type,
  project_title text,
  project_description text,
  ownership_level int check (ownership_level between 1 and 5),

  had_mentor boolean not null default false,
  mentor_interaction mentor_frequency,
  feedback_quality int check (feedback_quality between 1 and 5),
  doubt_support boolean not null default false,
  code_review boolean not null default false,

  prerequisites text[] not null default '{}',
  technologies_taught text[] not null default '{}',
  skills_gained text[] not null default '{}',
  skills_before text[] not null default '{}',
  skills_after text[] not null default '{}',
  tasks_completed text,
  confidence_after int check (confidence_after between 1 and 5),

  got_certificate boolean not null default false,
  got_recommendation_letter boolean not null default false,
  is_portfolio_project boolean not null default false,
  github_url text,
  pre_placement_offer boolean not null default false,
  extension_offered boolean not null default false,

  beginner_friendly boolean,
  recommended_for text,
  not_recommended_for text,

  application_channel application_channel,
  application_steps text,
  had_interview boolean not null default false,
  had_technical_test boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index experiences_status_idx on experiences (status);
create index experiences_domain_idx on experiences (domain);
create index experiences_company_idx on experiences (company_id);
create index experiences_contributor_idx on experiences (contributor_id);

create table evidence (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references experiences (id) on delete cascade,
  type evidence_type not null,
  storage_path text not null,
  visibility evidence_visibility not null default 'faculty_only',
  uploaded_at timestamptz not null default now()
);

create index evidence_experience_idx on evidence (experience_id);

create table verifications (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references experiences (id) on delete cascade,
  faculty_id uuid not null references profiles (id),
  action verification_action not null,
  note text,
  created_at timestamptz not null default now()
);

create index verifications_experience_idx on verifications (experience_id);

create table questions (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references experiences (id) on delete cascade,
  asked_by uuid not null references profiles (id),
  question text not null,
  answer text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

create index questions_experience_idx on questions (experience_id);

create table saved_experiences (
  student_id uuid not null references profiles (id) on delete cascade,
  experience_id uuid not null references experiences (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (student_id, experience_id)
);

create table generated_assets (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references experiences (id) on delete cascade,
  type asset_type not null,
  content text not null,
  edited_content text,
  created_at timestamptz not null default now(),
  unique (experience_id, type)
);

alter table profiles enable row level security;
alter table companies enable row level security;
alter table experiences enable row level security;
alter table evidence enable row level security;
alter table verifications enable row level security;
alter table questions enable row level security;
alter table saved_experiences enable row level security;
alter table generated_assets enable row level security;
