"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Field } from "@/components/ui/Field";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> & {
  id?: string;
  label: string;
  icon?: ReactNode;
  error?: string;
  dense?: boolean;
  className?: string;
};

/**
 * The designs draw an eye icon on both password fields but wire nothing to it.
 * Here it actually toggles, and is a real button so it can be reached by keyboard.
 */
export function PasswordField({
  id,
  label,
  icon,
  error,
  dense,
  className,
  ...props
}: PasswordFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <Field
      id={fieldId}
      label={label}
      icon={icon}
      error={error}
      dense={dense}
      className={className}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="shrink-0 cursor-pointer rounded text-text-dim transition-colors hover:text-text-secondary"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
      {...props}
    />
  );
}
