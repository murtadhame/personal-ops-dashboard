// Centralized environment loading + light validation.
// Loads the repo-root .env so both apps share one secrets file.
import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", "..", "..", ".env") });

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.warn(`⚠ Missing env ${name} — features depending on it will fail until set.`);
    return "";
  }
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:4000",
  timezone: process.env.APP_TIMEZONE ?? "Asia/Riyadh",

  databaseUrl: required("DATABASE_URL"),

  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  parserModel: process.env.ANTHROPIC_PARSER_MODEL ?? "claude-sonnet-4-6",
  cheapModel: process.env.ANTHROPIC_CHEAP_MODEL ?? "claude-haiku-4-5-20251001",

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4000/api/calendar/google/callback",
  },

  capturePepper: process.env.CAPTURE_TOKEN_PEPPER ?? "",
};
