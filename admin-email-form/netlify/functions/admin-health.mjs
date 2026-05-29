import { config, missingSmtpConfig } from "../../src/config.mjs";
import { getHeader, jsonResponse } from "./_shared.mjs";

export async function handler(event) {
  if (!config.adminAccessToken) {
    return jsonResponse(503, { ok: false, message: "Admin access belum dikonfigurasi." });
  }

  const authHeader = getHeader(event, "authorization");
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const headerToken = getHeader(event, "x-admin-token").trim();
  const token = bearerToken || headerToken;

  if (token !== config.adminAccessToken) {
    return jsonResponse(401, { ok: false, message: "Tidak diizinkan." });
  }

  return jsonResponse(200, {
    ok: true,
    mailMode: config.mailMode,
    adminEmailConfigured: Boolean(config.adminEmail),
    missingSmtpConfig: config.mailMode === "smtp" ? missingSmtpConfig() : []
  });
}
