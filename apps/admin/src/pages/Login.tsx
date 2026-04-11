import { Button, Card, Input } from "@kunda/ui";
import { getGatewayBaseUrl } from "../lib/api";

export default function Login() {
  return (
    <div className="login-shell">
      <Card
        eyebrow="Restricted access"
        title="Sign in to Kunda Admin"
        style={{ maxWidth: 460, width: "100%" }}
      >
        <div className="stack-list">
          <p className="muted-copy">
            This dashboard is intended for internal ops users over VPN. Gateway:
            {" "}
            {getGatewayBaseUrl()}
          </p>
          <Input
            autoComplete="username"
            hint="Use your internal admin email."
            label="Email"
            placeholder="ops@kunda.properties"
          />
          <Input
            autoComplete="current-password"
            hint="Password auth can be replaced with SSO later."
            label="Password"
            placeholder="Enter your password"
            type="password"
          />
          <Button fullWidth>Continue</Button>
        </div>
      </Card>
    </div>
  );
}
