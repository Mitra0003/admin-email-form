import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.dirname(__dirname);

loadEnvFile(path.join(appDir, ".env"));

export const config = {
  port: numberFromEnv("PORT", 18200),
  adminAccessToken: process.env.ADMIN_ACCESS_TOKEN || "",
  adminEmail: process.env.ADMIN_EMAIL || "mitrasyaputra00@gmail.com",
  mailMode: (process.env.MAIL_MODE || "preview").toLowerCase(),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: numberFromEnv("SMTP_PORT", 465),
    secure: booleanFromEnv("SMTP_SECURE", true),
    user: process.env.SMTP_USER || "",
    pass: (process.env.SMTP_PASS || "").replace(/\s+/g, ""),
    from: process.env.SMTP_FROM || process.env.SMTP_USER || ""
  }
};

export function missingSmtpConfig() {
  const missing = [];

  if (!config.adminEmail) missing.push("ADMIN_EMAIL");
  if (!config.smtp.host) missing.push("SMTP_HOST");
  if (!config.smtp.user) missing.push("SMTP_USER");
  if (!config.smtp.pass) missing.push("SMTP_PASS");
  if (!config.smtp.from) missing.push("SMTP_FROM");

  return missing;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function numberFromEnv(key, fallback) {
  const value = Number(process.env[key]);
  return Number.isFinite(value) ? value : fallback;
}

function booleanFromEnv(key, fallback) {
  const value = process.env[key];
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}
