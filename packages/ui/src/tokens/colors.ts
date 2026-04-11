export const kundaColors = {
  forest: "#0F6E56",
  forestDeep: "#0B4F3F",
  forestSoft: "#DCEEE8",
  gold: "#BA7517",
  goldSoft: "#F6E7CF",
  ink: "#18261F",
  muted: "#627067",
  clay: "#EFE0D3",
  background: "#F6F1E8",
  surface: "#FFFFFF",
  border: "rgba(24, 38, 31, 0.12)",
  info: "#1D4ED8",
  infoSoft: "#DBEAFE",
  success: "#0F766E",
  successSoft: "#CCFBF1",
  warning: "#B45309",
  warningSoft: "#FEF3C7",
  danger: "#B42318",
  dangerSoft: "#FEE4E2",
  neutralSoft: "#F2F4F7",
} as const;

export type KundaColorName = keyof typeof kundaColors;
