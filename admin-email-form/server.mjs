import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, missingSmtpConfig } from "./src/config.mjs";
import { sendAdminEmail } from "./src/emailService.mjs";
import { validateSubmission } from "./src/validation.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const submitRateLimits = new Map();
const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()"
};
const activityStats = {
  acceptedSubmissions: 0,
  rejectedSubmissions: 0,
  lastAcceptedAt: null
};

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".json", "application/json; charset=utf-8"]
]);

createServer(async (req, res) => {
  try {
    setSecurityHeaders(res);
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/api/health") {
      sendJson(res, {
        ok: true
      });
      return;
    }

    if (url.pathname === "/api/admin/health") {
      if (!requireAdmin(req, res)) return;

      sendJson(res, {
        ok: true,
        mailMode: config.mailMode,
        adminEmailConfigured: Boolean(config.adminEmail),
        missingSmtpConfig: config.mailMode === "smtp" ? missingSmtpConfig() : [],
        activity: activityStats
      });
      return;
    }

    if (url.pathname === "/api/submissions") {
      await handleSubmission(req, res);
      return;
    }

    serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error.name, error.message);
    sendJson(res, { ok: false, message: "Server sedang bermasalah." }, 500);
  }
}).listen(config.port, "0.0.0.0", () => {
  console.log(`Admin Email Form running at http://localhost:${config.port}`);
});

async function handleSubmission(req, res) {
  if (req.method !== "POST") {
    sendJson(res, { ok: false, message: "Method tidak didukung." }, 405);
    return;
  }

  if (!allowSubmit(req)) {
    activityStats.rejectedSubmissions += 1;
    sendJson(res, { ok: false, message: "Terlalu banyak percobaan. Coba lagi nanti." }, 429);
    return;
  }

  const payload = await readJsonBody(req);
  const validation = validateSubmission(payload);

  if (!validation.ok) {
    activityStats.rejectedSubmissions += 1;
    sendJson(res, { ok: false, message: "Periksa kembali data form.", errors: validation.errors }, 400);
    return;
  }

  try {
    const delivery = await sendAdminEmail(validation.data);
    const message =
      delivery.mode === "smtp"
        ? "Data berhasil dikirim ke email admin."
        : "Data valid. Mode preview aktif, jadi email keluar belum dikirim.";

    activityStats.acceptedSubmissions += 1;
    activityStats.lastAcceptedAt = new Date().toISOString();
    sendJson(res, { ok: true, message, deliveryMode: delivery.mode });
  } catch (error) {
    activityStats.rejectedSubmissions += 1;
    const status = error.name === "EmailConfigurationError" ? 503 : 502;
    const message =
      error.name === "EmailConfigurationError"
        ? error.message
        : "Gagal mengirim email. Periksa SMTP_USER dan SMTP_PASS. Gmail biasanya membutuhkan App Password.";
    sendJson(res, { ok: false, message }, status);
  }
}

function allowSubmit(req) {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 8;
  const key = req.socket.remoteAddress || "unknown";
  const current = submitRateLimits.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }

  current.count += 1;
  submitRateLimits.set(key, current);

  return current.count <= maxRequests;
}

function requireAdmin(req, res) {
  if (!config.adminAccessToken) {
    sendJson(res, { ok: false, message: "Admin access belum dikonfigurasi." }, 503);
    return false;
  }

  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const headerToken = String(req.headers["x-admin-token"] || "").trim();
  const token = bearerToken || headerToken;

  if (token !== config.adminAccessToken) {
    sendJson(res, { ok: false, message: "Tidak diizinkan." }, 401);
    return false;
  }

  return true;
}

function serveStatic(urlPath, res) {
  const requestedPath = urlPath === "/" ? "/index.html" : decodeURIComponent(urlPath);
  const normalized = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, normalized);
  const relativePath = path.relative(publicDir, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath) || !existsSync(filePath)) {
    sendText(res, "Not found", 404);
    return;
  }

  res.writeHead(200, {
    "Content-Type": mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(filePath).pipe(res);
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 32_000) {
      return null;
    }
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    return null;
  }
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, message, status = 200) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
}

function setSecurityHeaders(res) {
  for (const [name, value] of Object.entries(securityHeaders)) {
    res.setHeader(name, value);
  }
}
