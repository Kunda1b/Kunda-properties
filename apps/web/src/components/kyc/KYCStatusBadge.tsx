import type { KYCStatus } from "@kunda/types"

type Props = {
  status: KYCStatus
  showLabel?: boolean
  size?: "sm" | "md"
}

const STATUS_CONFIG: Record<
  KYCStatus,
  { label: string; bg: string; color: string; icon: string }
> = {
  PENDING: {
    label: "Not started",
    bg: "#F1EFE8",
    color: "#444441",
    icon: "○",
  },
  SUBMITTED: {
    label: "Under review",
    bg: "#FAEEDA",
    color: "#633806",
    icon: "◔",
  },
  APPROVED: {
    label: "Verified",
    bg: "#E1F5EE",
    color: "#085041",
    icon: "✓",
  },
  REJECTED: {
    label: "Rejected",
    bg: "#FAECE7",
    color: "#712B13",
    icon: "✕",
  },
}

export default function KYCStatusBadge({
  status,
  showLabel = true,
  size = "md",
}: Props) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className="inline-flex items-center gap-1.5 font-medium rounded-full"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: size === "sm" ? "2px 8px" : "4px 10px",
        fontSize: size === "sm" ? "10px" : "12px",
      }}
    >
      <span>{config.icon}</span>
      {showLabel && config.label}
    </span>
  )
}
