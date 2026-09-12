import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  error?: string;
  dense?: boolean;
  hint?: string;
};

export function Field({
  id,
  label,
  icon,
  trailing,
  error,
  dense = false,
  hint,
  className = "",
  ...props
}: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-2 block text-label text-fg-mid">
        {label}
      </label>

      <div
        className={[
          "flex items-center gap-3 rounded-sm border bg-panel-raised transition-colors duration-150 ease-out",
          dense ? "px-4 py-3" : "px-5 py-4",
          error
            ? "border-fault"
            : "border-edge focus-within:border-brand",
        ].join(" ")}
      >
        {icon ? (
          <span className={error ? "shrink-0 text-fault" : "shrink-0 text-fg-faint"}>
            {icon}
          </span>
        ) : null}

        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 border-none bg-transparent text-body text-fg outline-none"
          {...props}
        />

        {trailing}
      </div>

      {hint && !error ? (
        <p id={hintId} className="mt-2 text-body-sm text-fg-faint">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-body-sm font-medium text-fault">
          {error}
        </p>
      ) : null}
    </div>
  );
}
