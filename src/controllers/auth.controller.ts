import "server-only";

import * as Mock from "@/lib/mock/data";
import type { OrgTree } from "@/types/contracts";

/** STUB — package 1 owns this file. */

/**
 * Fills the cascading dropdowns on the registration page.
 *
 * Deliberately has no auth guard: the visitor is not signed in yet. It returns
 * ids and names only, no personal data, so sending the whole tree is safe and
 * avoids opening a public API just for this.
 */
export async function getOrgTree(): Promise<OrgTree> {
  return Mock.MOCK_ORG_TREE;
}
