import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

function loadWorkspaceEnvFile() {
  if (typeof process.loadEnvFile !== "function") {
    return;
  }

  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "..", ".env"),
    resolve(process.cwd(), "..", "..", ".env"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      process.loadEnvFile(candidate);
      break;
    }
  }
}

loadWorkspaceEnvFile();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("24h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  AUTH_SERVICE_URL: z.string().url().optional(),
  LISTINGS_SERVICE_URL: z.string().url().optional(),
  ESCROW_SERVICE_URL: z.string().url().optional(),
  DOCUMENTS_SERVICE_URL: z.string().url().optional(),
  NOTIFICATIONS_SERVICE_URL: z.string().url().optional(),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  API_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  STORAGE_ROOT: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_ENDPOINT: z.string().optional(),
  AWS_FORCE_PATH_STYLE: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SMILE_PARTNER_ID: z.string().optional(),
  SMILE_API_KEY: z.string().optional(),
  SMILE_CALLBACK_URL: z.string().url().optional(),
  SMILE_SERVER_MODE: z.enum(["0", "1"]).default("0"),
  WAVE_API_KEY: z.string().optional(),
  WAVE_BASE_URL: z.string().url().default("https://api.wave.com"),
  ORANGE_MONEY_BASE_URL: z.string().url().optional(),
  ORANGE_MONEY_TOKEN_URL: z.string().url().optional(),
  ORANGE_MONEY_CLIENT_ID: z.string().optional(),
  ORANGE_MONEY_CLIENT_SECRET: z.string().optional(),
  ORANGE_MONEY_MERCHANT_KEY: z.string().optional(),
  ORANGE_MONEY_WEBPAY_PATH: z.string().optional(),
  ORANGE_MONEY_STATUS_PATH: z.string().optional(),
  ORANGE_MONEY_REFUND_PATH: z.string().optional(),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment variables:");
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
