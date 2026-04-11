import type { CSSProperties } from "react";
import {
  kundaColors,
  kundaRadii,
  kundaSpacing,
  kundaTypography,
} from "../tokens";

export type TabOption = {
  label: string;
  value: string;
};

type TabsProps = {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
};

export function Tabs({ onChange, options, value }: TabsProps) {
  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        border: `1px solid ${kundaColors.border}`,
        borderRadius: kundaRadii.lg,
        display: "inline-flex",
        flexWrap: "wrap",
        gap: kundaSpacing.xs,
        padding: 6,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        const activeStyle: CSSProperties = active
          ? {
              backgroundColor: kundaColors.forest,
              boxShadow: "0 8px 20px rgba(15, 110, 86, 0.18)",
              color: kundaColors.surface,
            }
          : {
              color: kundaColors.muted,
            };

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              borderRadius: kundaRadii.md,
              cursor: "pointer",
              fontFamily: kundaTypography.body,
              fontSize: 13,
              fontWeight: 700,
              minWidth: 92,
              padding: "10px 14px",
              transition: "background-color 140ms ease, color 140ms ease",
              ...activeStyle,
            }}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
