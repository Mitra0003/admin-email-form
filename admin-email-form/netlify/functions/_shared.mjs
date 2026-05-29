export const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()"
};

export function jsonResponse(statusCode, payload, headers = {}) {
  return {
    statusCode,
    headers: {
      ...securityHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    },
    body: JSON.stringify(payload)
  };
}

export function getHeader(event, headerName) {
  const wanted = headerName.toLowerCase();
  const headers = event.headers || {};

  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === wanted) {
      return String(value || "");
    }
  }

  return "";
}

export function parseJsonBody(event) {
  if (!event.body) return {};

  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}
