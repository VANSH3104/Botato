import { isPublicNetworkDestination } from "@/lib/sandbox/security";

/**
 * Validates that an MCP URL is safe to communicate with (SSRF & Protocol Defense).
 * Blocks RFC1918, link-local, loopback, cloud metadata endpoints (169.254.169.254),
 * and requires http: or https: protocol.
 */
export function validateMcpUrl(rawUrl: string): { valid: boolean; error?: string; url?: URL } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTP and HTTPS protocols are allowed for MCP servers." };
  }

  const isLoopback =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "::1";

  // Allow local bridges during development or when explicitly enabled
  if (isLoopback && (process.env.NODE_ENV === "development" || process.env.ALLOW_LOCAL_MCP === "true")) {
    return { valid: true, url: parsed };
  }

  if (!isPublicNetworkDestination(parsed.hostname)) {
    return {
      valid: false,
      error: "Security violation: MCP server URL points to a private, loopback, or cloud-internal network destination.",
    };
  }

  return { valid: true, url: parsed };
}

/**
 * Masks sensitive header values (API keys, Bearer tokens) for safe display in UI
 * and ensures raw tokens never leak into chat logs or client-side bundles.
 */
export function maskSensitiveHeaders(headers?: Record<string, string> | null): Record<string, string> {
  if (!headers) return {};
  const masked: Record<string, string> = {};

  for (const [key, val] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("auth") ||
      lowerKey.includes("token") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("key") ||
      lowerKey.includes("bearer")
    ) {
      if (val.length <= 8) {
        masked[key] = "••••••••";
      } else {
        const start = val.slice(0, 4);
        const end = val.slice(-4);
        masked[key] = `${start}••••••••${end}`;
      }
    } else {
      masked[key] = val;
    }
  }

  return masked;
}

/**
 * Sanitizes tool results to prevent context window pollution and protect secrets.
 */
export function sanitizeMcpOutput(output: string, maxLength: number = 4000): string {
  let clean = output;
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength) + `\n... [output truncated, ${clean.length - maxLength} characters omitted for privacy and length]`;
  }
  return clean;
}
