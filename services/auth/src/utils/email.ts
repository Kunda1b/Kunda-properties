import nodemailer from "nodemailer";
import * as configModule from "@kunda/config";

const { env, logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

function getTransporter() {
  if (env.NODE_ENV === "development") {
    return nodemailer.createTransport({
      host: "localhost",
      port: 1025,
      ignoreTLS: true,
    });
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendOTPEmail(
  to: string,
  name: string,
  otp: string,
): Promise<void> {
  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: '"Kunda Properties" <hello@kundaproperties.gm>',
      to,
      subject: `Your Kunda verification code: ${otp}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0F6E56;">Verify your email</h2>
          <p>Hi ${name},</p>
          <p>Your Kunda Properties verification code is:</p>
          <div style="
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #0F6E56;
            padding: 20px;
            background: #E1F5EE;
            border-radius: 12px;
            text-align: center;
            margin: 24px 0;
          ">${otp}</div>
          <p style="color: #888;">This code expires in 10 minutes.</p>
          <p style="color: #888;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    logger.info("OTP email sent", { to });
  } catch (error) {
    logger.error("Failed to send OTP email", {
      to,
      error: error instanceof Error ? error.message : "Unknown email error",
    });
    throw error;
  }
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
): Promise<void> {
  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: '"Kunda Properties" <hello@kundaproperties.gm>',
      to,
      subject: "Welcome to Kunda Properties",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0F6E56;">Welcome to Kunda, ${name}</h2>
          <p>Your account is verified and ready to use.</p>
          <p>You can now:</p>
          <ul>
            <li>Browse verified Gambian properties</li>
            <li>Save listings to your dashboard</li>
            <li>Enquire directly with agents</li>
            <li>Start the KYC process to unlock escrow</li>
          </ul>
          <a href="https://kundaproperties.gm/listings"
            style="
              display: inline-block;
              background: #0F6E56;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              margin-top: 16px;
            ">
            Browse listings
          </a>
        </div>
      `,
    });

    logger.info("Welcome email sent", { to });
  } catch (error) {
    logger.error("Failed to send welcome email", {
      to,
      error: error instanceof Error ? error.message : "Unknown email error",
    });
  }
}
