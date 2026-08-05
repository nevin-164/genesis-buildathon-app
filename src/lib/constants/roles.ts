import type { Role } from "@/types/contracts";

export const HOME_FOR_ROLE: Record<Role, string> = {
  student: "/student",
  faculty: "/faculty",
  admin: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  faculty: "Faculty",
  admin: "Administrator",
};

export const NAV_FOR_ROLE: Record<Role, { href: string; label: string }[]> = {
  student: [
    { href: "/student", label: "Dashboard" },
    { href: "/student/explore", label: "Explore" },
    { href: "/student/internships", label: "My Internships" },
  ],
  faculty: [
    { href: "/faculty", label: "Dashboard" },
    { href: "/faculty/students", label: "Students" },
    { href: "/faculty/verifications", label: "Verifications" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/departments", label: "Organisation" },
    { href: "/admin/assignments", label: "Assignments" },
  ],
};
