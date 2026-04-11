import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import {
  kundaColors,
  kundaRadii,
  kundaShadows,
  kundaSpacing,
  kundaTypography,
} from "../tokens";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  padded?: boolean;
};

export function Card({
  actions,
  children,
  eyebrow,
  padded = true,
  style,
  title,
  ...props
}: CardProps) {
  const shellStyle: CSSProperties = {
    background: "rgba(255, 255, 255, 0.92)",
    border: `1px solid ${kundaColors.border}`,
    borderRadius: kundaRadii.lg,
    boxShadow: kundaShadows.card,
    padding: padded ? kundaSpacing.lg : undefined,
  };

  return (
    <div {...props} style={{ ...shellStyle, ...style }}>
      {eyebrow || title || actions ? (
        <div
          style={{
            alignItems: "flex-start",
            display: "flex",
            gap: kundaSpacing.md,
            justifyContent: "space-between",
            marginBottom: children ? kundaSpacing.md : 0,
          }}
        >
          <div>
            {eyebrow ? (
              <div
                style={{
                  color: kundaColors.muted,
                  fontFamily: kundaTypography.body,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <div
                style={{
                  color: kundaColors.ink,
                  fontFamily: kundaTypography.body,
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {title}
              </div>
            ) : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
