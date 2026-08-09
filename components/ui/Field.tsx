import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  /** Rendered as the uppercase micro-label above the well. */
  label: string;
  icon?: ReactNode;
  /** Rendered inside the well, after the input — e.g. the password eye toggle. */
  trailing?: ReactNode;
  error?: string;
  /** Signup uses slightly tighter wells (15/18px) than Login (16/20px). */
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
    // min-w-0 so the field can shrink when used as a flex item — without it the
    // default min-width:auto keeps it at content width and it overflows its row.
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="label-caps mb-2.5 block">
        {label}
      </label>

      <div
        className={[
          "flex items-center gap-3 rounded-field border bg-field transition-colors",
          dense ? "px-[18px] py-[15px]" : "px-5 py-4",
          error
            ? "border-danger"
            : "border-border focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30",
        ].join(" ")}
      >
        {icon ? (
          <span className={error ? "shrink-0 text-danger" : "shrink-0 text-text-dim"}>
            {icon}
          </span>
        ) : null}

        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 border-none bg-transparent text-base text-text-input outline-none"
          {...props}
        />

        {trailing}
      </div>

      {hint && !error ? (
        <p id={hintId} className="mt-2 text-[13px] text-text-dim">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
