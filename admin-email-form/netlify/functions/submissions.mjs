import { sendAdminEmail } from "../../src/emailService.mjs";
import { validateSubmission } from "../../src/validation.mjs";
import { getHeader, jsonResponse, parseJsonBody } from "./_shared.mjs";

const submitRateLimits = new Map();

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, message: "Method tidak didukung." }, { Allow: "POST" });
  }

  if (!allowSubmit(event)) {
    return jsonResponse(429, { ok: false, message: "Terlalu banyak percobaan. Coba lagi nanti." });
  }

  const payload = parseJsonBody(event);
  const validation = validateSubmission(payload);

  if (!validation.ok) {
    return jsonResponse(400, { ok: false, message: "Periksa kembali data form.", errors: validation.errors });
  }

  try {
    const delivery = await sendAdminEmail(validation.data);
    const message =
      delivery.mode === "smtp"
        ? "Data berhasil dikirim ke email admin."
        : "Data valid. Mode preview aktif, jadi email keluar belum dikirim.";

    return jsonResponse(200, { ok: true, message, deliveryMode: delivery.mode });
  } catch (error) {
    const status = error.name === "EmailConfigurationError" ? 503 : 502;
    const message =
      error.name === "EmailConfigurationError"
        ? error.message
        : "Gagal mengirim email. Periksa SMTP_USER dan SMTP_PASS. Gmail biasanya membutuhkan App Password.";

    return jsonResponse(status, { ok: false, message });
  }
}

function allowSubmit(event) {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 8;
  const key = getClientKey(event);
  const current = submitRateLimits.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }

  current.count += 1;
  submitRateLimits.set(key, current);

  return current.count <= maxRequests;
}

function getClientKey(event) {
  const forwardedFor = getHeader(event, "x-forwarded-for").split(",")[0]?.trim();
  const netlifyIp = getHeader(event, "client-ip").trim();

  return forwardedFor || netlifyIp || "unknown";
}
