import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import {
  kundaColors,
  kundaRadii,
  kundaShadows,
  kundaSpacing,
  kundaTypography,
} from "../tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: {
    fontSize: 13,
    padding: "10px 14px",
  },
  md: {
    fontSize: 14,
    padding: "12px 18px",
  },
  lg: {
    fontSize: 15,
    padding: "14px 20px",
  },
};

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: `linear-gradient(135deg, ${kundaColors.forest} 0%, ${kundaColors.forestDeep} 100%)`,
    color: kundaColors.surface,
    boxShadow: kundaShadows.highlight,
  },
  secondary: {
    backgroundColor: kundaColors.surface,
    border: `1px solid ${kundaColors.border}`,
    color: kundaColors.ink,
  },
  ghost: {
    backgroundColor: "transparent",
    color: kundaColors.muted,
  },
  danger: {
    backgroundColor: kundaColors.danger,
    color: kundaColors.surface,
    boxShadow: "0 12px 28px rgba(180, 35, 24, 0.18)",
  },
};

export function Button({
  children,
  fullWidth = false,
  leadingIcon,
  size = "md",
  style,
  trailingIcon,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const baseStyle: CSSProperties = {
    alignItems: "center",
    appearance: "none",
    border: "none",
    borderRadius: kundaRadii.md,
    cursor: props.disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    fontFamily: kundaTypography.body,
    fontWeight: 600,
    gap: kundaSpacing.xs,
    justifyContent: "center",
    lineHeight: 1.1,
    opacity: props.disabled ? 0.6 : 1,
    transition: "transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease",
    width: fullWidth ? "100%" : undefined,
  };

  return (
    <button
      {...props}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      type={type}
    >
      {leadingIcon ? <span aria-hidden="true">{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span aria-hidden="true">{trailingIcon}</span> : null}
    </button>
  );
}
