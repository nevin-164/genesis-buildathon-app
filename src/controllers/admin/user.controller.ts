import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Mock from "@/lib/mock/data";
import type {
  AdminCounts,
  AdminUserFilters,
  AdminUserRow,
  FacultyOption,
} from "@/types/contracts";

/** STUB — package 3 owns this file. Signatures are the contract with package 6. */

export async function getAdminCounts(): Promise<AdminCounts> {
  await requireRole("admin");
  return Mock.MOCK_ADMIN_COUNTS;
}

export async function listUsers(
  filters: AdminUserFilters,
): Promise<{ items: AdminUserRow[]; total: number }> {
  await requireRole("admin");

  const items = Mock.MOCK_ADMIN_USERS.filter((u) => {
    if (filters.role && u.role !== filters.role) return false;
    if (filters.isActive !== undefined && u.isActive !== filters.isActive) return false;
    if (filters.q) {
      const hay = `${u.fullName} ${u.email}`.toLowerCase();
      if (!hay.includes(filters.q.toLowerCase())) return false;
    }
    return true;
  });

  return { items, total: items.length };
}

export async function getUser(id: string): Promise<AdminUserRow> {
  await requireRole("admin");
  return Mock.MOCK_ADMIN_USERS.find((u) => u.id === id) ?? Mock.MOCK_ADMIN_USERS[0];
}

export async function createUser(_input: unknown): Promise<{ id: string }> {
  await requireRole("admin");
  return { id: "u-new" };
}

export async function updateUser(_id: string, _input: unknown): Promise<void> {
  await requireRole("admin");
}

/** Real version also bumps users.session_version so they are signed out at once. */
export async function setUserActive(_id: string, _isActive: boolean): Promise<void> {
  await requireRole("admin");
}

export async function resetUserPassword(_id: string, _newPassword: string): Promise<void> {
  await requireRole("admin");
}

export async function listFacultyOptions(): Promise<FacultyOption[]> {
  await requireRole("admin");
  return Mock.MOCK_FACULTY;
}
