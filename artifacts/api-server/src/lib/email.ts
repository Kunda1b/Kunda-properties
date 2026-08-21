import { logger } from "./logger.js";

/**
 * Send a reset email without adding a provider SDK to the API bundle.
 * Resend is optional in development, but production must configure it.
 */
export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const frontend = (process.env.PUBLIC_FRONTEND_URL || (process.env.PUBLIC_URL || "").replace(/\/api$/, "")).replace(/\/+$/, "");

  if (!apiKey || !from || !frontend) {
    if (process.env.NODE_ENV === "production") {
      logger.error({ configured: Boolean(apiKey && from && frontend) }, "Password reset email is not configured");
      return;
    }
    logger.info({ email: to, resetPath: `/auth/reset-password?token=${encodeURIComponent(token)}` }, "Development password reset link");
    return;
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Reset your Kunda password",
        text: `Reset your password: ${frontend}/auth/reset-password?token=${encodeURIComponent(token)}\n\nThis link expires in 15 minutes.`,
      }),
    });
  } catch (err) {
    logger.error({ err }, "Password reset email provider request failed");
    return;
  }

  if (!response.ok) {
    logger.error({ status: response.status }, "Password reset email provider rejected the request");
  }
}
