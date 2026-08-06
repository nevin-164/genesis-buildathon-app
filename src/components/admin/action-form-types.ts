import type { ActionState } from "@/types/contracts";

/**
 * The shape every admin Server Action in `app/(app)/admin/**` has, so the form
 * components can be typed once. Matches `useActionState`'s expectation:
 * (previousState, formData) => nextState.
 */
export type FormAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;
