import type { CSSProperties, HTMLAttributes } from "react";
import {
  kundaColors,
  kundaRadii,
  kundaSpacing,
  kundaTypography,
} from "../tokens";

type BadgeTone =
  | "forest"
  | "gold"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneStyles: Record<BadgeTone, CSSProperties> = {
  forest: { backgroundColor: kundaColors.forestSoft, color: kundaColors.forest },
  gold: { backgroundColor: kundaColors.goldSoft, color: kundaColors.gold },
  info: { backgroundColor: kundaColors.infoSoft, color: kundaColors.info },
  success: { backgroundColor: kundaColors.successSoft, color: kundaColors.success },
  warning: { backgroundColor: kundaColors.warningSoft, color: kundaColors.warning },
  danger: { backgroundColor: kundaColors.dangerSoft, color: kundaColors.danger },
  neutral: { backgroundColor: kundaColors.neutralSoft, color: kundaColors.ink },
};

export function Badge({ children, style, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      {...props}
      style={{
        alignItems: "center",
        borderRadius: kundaRadii.pill,
        display: "inline-flex",
        fontFamily: kundaTypography.body,
        fontSize: 12,
        fontWeight: 700,
        gap: kundaSpacing.xs,
        letterSpacing: "0.02em",
        padding: "6px 10px",
        textTransform: "uppercase",
        ...toneStyles[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
