const SENSITIVE_KEYS = new Set([
  "checkoutAccessToken",
  "token",
  "paymentId",
  "preferenceId",
  "externalReference",
  "authorization",
  "senha",
  "password",
  "cpf",
  "telefone",
  "telefoneEntrega",
]);

function maskMiddle(value, visibleStart = 3, visibleEnd = 2) {
  const raw = String(value || "");
  if (!raw) return raw;
  if (raw.length <= visibleStart + visibleEnd) return "***";
  return `${raw.slice(0, visibleStart)}***${raw.slice(-visibleEnd)}`;
}

export function sanitizeUrl(originalUrl = "") {
  try {
    const [pathname, search = ""] = String(originalUrl).split("?");
    if (!search) return pathname;

    const params = new URLSearchParams(search);
    for (const key of params.keys()) {
      const lower = key.toLowerCase();
      if (lower.includes("token") || lower.includes("authorization")) {
        params.set(key, "***");
      }
    }

    const redactedQuery = params.toString();
    return redactedQuery ? `${pathname}?${redactedQuery}` : pathname;
  } catch {
    return "/redacted-url";
  }
}

export function sanitizeObject(payload) {
  if (!payload || typeof payload !== "object") return payload;

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeObject(item));
  }

  const cloned = {};

  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(lowerKey);

    if (isSensitive) {
      if (lowerKey === "cpf") {
        cloned[key] = maskMiddle(value, 3, 2);
      } else if (lowerKey.includes("telefone")) {
        cloned[key] = maskMiddle(value, 2, 2);
      } else {
        cloned[key] = "***";
      }
      continue;
    }

    cloned[key] = sanitizeObject(value);
  }

  return cloned;
}

export function buildSuspiciousAttemptLog({
  event,
  req,
  details = {},
}) {
  return {
    event,
    method: req?.method,
    path: sanitizeUrl(req?.originalUrl || req?.url || ""),
    ip: req?.ip,
    userAgent: req?.headers?.["user-agent"] || null,
    details: sanitizeObject(details),
    at: new Date().toISOString(),
  };
}
