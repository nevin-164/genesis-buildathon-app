import "server-only";

import { UserModel } from "@/models/user.model";
import type { OrgTree } from "@/types/contracts";

/**
 * Fills the cascading dropdowns on the registration page.
 *
 * Deliberately has no auth guard: the visitor is not signed in yet. It returns
 * ids and names only, no personal data, so sending the whole tree is safe and
 * avoids opening a public API just for this.
 */
export async function getOrgTree(): Promise<OrgTree> {
  return UserModel.getRegistrationTree();
}
