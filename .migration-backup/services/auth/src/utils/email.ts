import sgMail from "@sendgrid/mail";
import { logger } from "./logger";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
const FROM = process.env.FROM_EMAIL || "noreply@kundaproperties.gm";
const APP_URL = process.env.APP_URL || "https://kundaproperties.gm";

export async function sendVerificationEmail(email: string, token: string, firstName: string) {
  const link = `${APP_URL}/auth/verify-email?token=${token}`;
  try {
    await sgMail.send({
      to: email, from: { email: FROM, name: "Kunda Properties" },
      subject: "Verify your Kunda Properties account",
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a5c38">Welcome to Kunda Properties, ${firstName}!</h2>
        <p>Please verify your email to get started.</p>
        <a href="${link}" style="display:inline-block;background:#1a5c38;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">Verify Email</a>
        <p style="color:#666;font-size:13px;margin-top:16px">This link expires in 24 hours.</p></div>`,
    });
  } catch (err) { logger.error({ err, email }, "Failed to send verification email"); }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${APP_URL}/auth/reset-password?token=${token}`;
  try {
    await sgMail.send({
      to: email, from: { email: FROM, name: "Kunda Properties" },
      subject: "Reset your Kunda Properties password",
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a5c38">Password Reset Request</h2>
        <a href="${link}" style="display:inline-block;background:#1a5c38;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">Reset Password</a>
        <p style="color:#666;font-size:13px;margin-top:16px">This link expires in 1 hour.</p></div>`,
    });
  } catch (err) { logger.error({ err, email }, "Failed to send reset email"); }
}
