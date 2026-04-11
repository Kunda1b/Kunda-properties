import type { ReactNode } from "react";
import { Badge } from "@kunda/ui";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  badge?: {
    label: string;
    tone?: "forest" | "gold" | "info" | "success" | "warning" | "danger" | "neutral";
  };
};

export function PageHeader({
  action,
  badge,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-copy">
        {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
        <div className="page-title-row">
          <h1 className="page-title">{title}</h1>
          {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}
        </div>
        <p className="page-description">{description}</p>
      </div>
      {action ? <div className="page-action">{action}</div> : null}
    </div>
  );
}
