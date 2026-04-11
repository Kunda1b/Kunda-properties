import type { ComponentType } from "react";
import type { Role } from "@kunda/types";
import { Card } from "@kunda/ui";

const activeRole: Role = "ADMIN";

export function withRoleGuard<P extends object>(
  Component: ComponentType<P>,
  allowedRoles: Role[],
) {
  function GuardedComponent(props: P) {
    if (!allowedRoles.includes(activeRole)) {
      return (
        <div className="guard-shell">
          <Card
            eyebrow="Access restricted"
            title="This area is limited to privileged roles."
          >
            <p className="muted-copy">
              Request VPN and admin access before opening this workflow.
            </p>
          </Card>
        </div>
      );
    }

    return <Component {...props} />;
  }

  GuardedComponent.displayName = `WithRoleGuard(${Component.displayName ?? Component.name ?? "Component"})`;

  return GuardedComponent;
}
