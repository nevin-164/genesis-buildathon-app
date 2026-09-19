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

/**
 * Explore is on all three navs deliberately. It lives under `/student` because
 * that is who writes for it, but the route policy admits every signed-in role
 * and staff have every reason to read it — a faculty member verifying a card
 * should be able to see what a published one looks like.
 */
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
    { href: "/student/explore", label: "Explore" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/departments", label: "Organisation" },
    // The only queue an administrator owns. It is on the nav rather than
    // buried behind a dashboard tile because an appeal is a student waiting on
    // a person, and nobody checks a tile they have to remember exists.
    { href: "/admin/appeals", label: "Appeals" },
    { href: "/student/explore", label: "Explore" },
  ],
};
