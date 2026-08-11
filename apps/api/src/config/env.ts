import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv({ path: path.join(process.cwd(), ".env") });
loadDotenv({ path: path.join(process.cwd(), "../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().default(1025),
  MAIL_FROM: z.string().default("YRS Toys <hello@yrstoys.in>"),

  CORS_ORIGIN_WEB: z.string().default("http://localhost:5173"),
  CORS_ORIGIN_ADMIN: z.string().default("http://localhost:5174"),

  UPLOAD_DIR: z.string().default("./uploads"),
  MAILHOG_UI_PORT: z.coerce.number().int().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = typeof env;
