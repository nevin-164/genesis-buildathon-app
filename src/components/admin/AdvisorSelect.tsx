import { CONTROL_SM_SELECT } from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";

/**
 * Structurally compatible with `FacultyOption` in types/contracts.ts — kept
 * loose here so a page can pass anything with an id and a name.
 */
export type FacultyOption = {
  id: string;
  fullName: string;
  email?: string | null;
};

/**
 * The faculty-advisor dropdown. Renders a plain <select> with no client state,
 * so it works inside a Server Component form and degrades without JavaScript.
 *
 * There is no "no advisor" option, and there must not be one — `advisor_id` is
 * NOT NULL, and a class with nobody responsible for it is the state the whole
 * routing design exists to remove. The placeholder is `disabled`, so the form
 * cannot be submitted until a real choice is made.
 *
 * `options` comes from `listFacultyOptions`, which excludes deactivated
 * accounts. An empty list means nobody has registered as faculty yet; the
 * caller renders its own explanation for that, since the fix is a person
 * signing up rather than anything on this screen.
 */
export function AdvisorSelect({
  options,
  defaultValue,
  name = "advisorId",
  id,
  className,
  placeholder = "— Choose an advisor —",
  required = true,
  disabled,
}: {
  options: FacultyOption[];
  defaultValue?: string | null;
  name?: string;
  id?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <select
      id={id ?? name}
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      disabled={disabled || options.length === 0}
      className={cn(CONTROL_SM_SELECT, className)}
    >
      <option value="" disabled>
        {options.length === 0 ? "— No faculty registered yet —" : placeholder}
      </option>
      {options.map((faculty) => (
        <option key={faculty.id} value={faculty.id}>
          {faculty.fullName}
          {faculty.email ? ` (${faculty.email})` : ""}
        </option>
      ))}
    </select>
  );
}
