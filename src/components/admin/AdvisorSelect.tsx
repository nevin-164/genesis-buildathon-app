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
 * The empty option is deliberate: clearing an advisor is a real action.
 */
export function AdvisorSelect({
  options,
  defaultValue,
  name = "advisorId",
  id,
  className,
  emptyLabel = "— No advisor —",
  disabled,
}: {
  options: FacultyOption[];
  defaultValue?: string | null;
  name?: string;
  id?: string;
  className?: string;
  emptyLabel?: string;
  disabled?: boolean;
}) {
  return (
    <select
      id={id ?? name}
      name={name}
      defaultValue={defaultValue ?? ""}
      disabled={disabled}
      className={`px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        className ?? ""
      }`}
    >
      <option value="">{emptyLabel}</option>
      {options.map((faculty) => (
        <option key={faculty.id} value={faculty.id}>
          {faculty.fullName}
          {faculty.email ? ` (${faculty.email})` : ""}
        </option>
      ))}
    </select>
  );
}
