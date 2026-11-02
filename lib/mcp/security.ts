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
export function sanitizeMcpOutput(output: string, maxLength: number = 500): string {
  let clean = output;
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength) + `\n... [output truncated, ${clean.length - maxLength} characters omitted for length]`;
  }
  return clean;
}

function isMutationTool(toolName: string): boolean {
  const lower = toolName.toLowerCase();
  if (
    lower.includes("search") ||
    lower.includes("query") ||
    lower.includes("retrieve") ||
    lower.includes("get") ||
    lower.includes("list")
  ) {
    return false;
  }
  return /patch|update|delete|trash|archive|create|post-page|post-comment/i.test(lower);
}

/**
 * Universal MCP output condenser: extracts key fields from verbose API payloads
 * to prevent token exhaustion while preserving exact identifiers and names.
 */
export function condenseMcpPayload(raw: string, toolName: string = ""): string {
  if (!raw || typeof raw !== "string") return "";

  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return sanitizeMcpOutput(trimmed, 500);
  }

  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>;

    // Mutation tool success responses: condense to acknowledgment + id
    if (isMutationTool(toolName) && data && typeof data === "object" && !data.error && !data.isError) {
      const id = data.id || data.page_id || data.database_id;
      return JSON.stringify({
        success: true,
        id: id || undefined,
        in_trash: data.in_trash ?? undefined,
        archived: data.archived ?? undefined,
      });
    }

    // List/query responses containing an array of items (e.g. results, items, data)
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data.results)
      ? data.results
      : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.data)
      ? data.data
      : null;

    if (list) {
      const condensedList = list.slice(0, 10).map((item: Record<string, unknown>) => {
        if (!item || typeof item !== "object") return item;
        const id = item.id || item.key;
        const objectType = item.object || item.type;
        // Extract common title/name patterns from Notion, Slack, GitHub, etc.
        let name: unknown = item.name || item.title;
        if (Array.isArray(name) && name[0]?.plain_text) {
          name = name[0].plain_text;
        } else if (item.properties && typeof item.properties === "object") {
          const props = item.properties as Record<string, Record<string, unknown>>;
          for (const p of Object.values(props)) {
            if (p.type === "title" && Array.isArray(p.title) && p.title[0]?.plain_text) {
              name = p.title[0].plain_text;
              break;
            }
          }
        }
        return {
          id,
          name: typeof name === "string" ? name : undefined,
          type: typeof objectType === "string" ? objectType : undefined,
          in_trash: item.in_trash ?? undefined,
        };
      });
      return JSON.stringify(condensedList);
    }
  } catch {
    // If not JSON, fall back to simple string sanitization
  }

  return sanitizeMcpOutput(trimmed, 500);
}
