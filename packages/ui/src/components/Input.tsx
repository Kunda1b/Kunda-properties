import type { InputHTMLAttributes } from "react";
import {
  kundaColors,
  kundaRadii,
  kundaSpacing,
  kundaTypography,
} from "../tokens";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hint?: string;
  error?: string;
  label?: string;
};

export function Input({ error, hint, label, style, ...props }: InputProps) {
  return (
    <label
      style={{
        display: "grid",
        gap: 8,
      }}
    >
      {label ? (
        <span
          style={{
            color: kundaColors.ink,
            fontFamily: kundaTypography.body,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      ) : null}
      <input
        {...props}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          border: `1px solid ${error ? kundaColors.danger : kundaColors.border}`,
          borderRadius: kundaRadii.md,
          color: kundaColors.ink,
          fontFamily: kundaTypography.body,
          fontSize: 14,
          minHeight: 46,
          outline: "none",
          padding: `0 ${kundaSpacing.md}px`,
          width: "100%",
          ...style,
        }}
      />
      {error ? (
        <span
          style={{
            color: kundaColors.danger,
            fontFamily: kundaTypography.body,
            fontSize: 12,
          }}
        >
          {error}
        </span>
      ) : hint ? (
        <span
          style={{
            color: kundaColors.muted,
            fontFamily: kundaTypography.body,
            fontSize: 12,
          }}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}
