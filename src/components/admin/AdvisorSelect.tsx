"use client";

export interface FacultyOption {
  id: string;
  name: string;
}

interface AdvisorSelectProps {
  name?: string;
  id?: string;
  defaultValue?: string | null;
  options: FacultyOption[];
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function AdvisorSelect({
  name = "advisorId",
  id = "advisorId",
  defaultValue = "",
  options,
  disabled = false,
  className = "",
  required = false,
}: AdvisorSelectProps) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue ?? ""}
      disabled={disabled}
      required={required}
      className={`px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50 ${className}`}
    >
      <option value="">(No advisor)</option>
      {options.map((faculty) => (
        <option key={faculty.id} value={faculty.id}>
          {faculty.name}
        </option>
      ))}
    </select>
  );
}
