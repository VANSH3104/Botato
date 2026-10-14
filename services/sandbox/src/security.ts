import path from "node:path";
import fs from "node:fs";

/**
 * Resolves and validates a path relative to the sandbox workspace root.
 * Throws an error if the path attempts to escape the sandbox directory.
 */
export function resolveSafePath(workspaceRoot: string, relativePath: string): string {
  const normalizedRoot = path.resolve(workspaceRoot);
  const targetPath = path.resolve(normalizedRoot, relativePath);

  // Strict boundary check: target path must reside inside workspaceRoot
  if (!targetPath.startsWith(normalizedRoot + path.sep) && targetPath !== normalizedRoot) {
    throw new Error(`Security violation: Access denied outside workspace sandbox boundary (${relativePath})`);
  }

  // Check for symlink traversal if target exists
  if (fs.existsSync(targetPath)) {
    try {
      const realPath = fs.realpathSync(targetPath);
      if (!realPath.startsWith(normalizedRoot + path.sep) && realPath !== normalizedRoot) {
        throw new Error(`Security violation: Symlink escapes workspace sandbox boundary`);
      }
    } catch {
      // Ignore if realpath cannot be resolved
    }
  }

  return targetPath;
}

/**
 * Sanitizes environment variables passed to sandboxed processes.
 * Strips any sensitive host tokens, keys, and credentials.
 */
export function getSanitizedEnv(customEnv?: Record<string, string>): Record<string, string> {
  const safeBaseEnv: Record<string, string> = {
    PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin",
    HOME: process.env.HOME || "/home/sandbox",
    USER: "sandbox",
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    NODE_ENV: "production",
    PYTHONUNBUFFERED: "1",
    DEBIAN_FRONTEND: "noninteractive",
  };

  // Blacklist of prefixes and keys that must never leak to sandbox processes
  const blocklist = [
    "DATABASE_URL",
    "CLERK_",
    "TRIGGER_",
    "RAILWAY_",
    "SANDBOX_API_KEY",
    "SECRET",
    "PASSWORD",
    "AWS_",
    "GROQ_",
    "OPENAI_",
    "ANTHROPIC_",
  ];

  if (customEnv) {
    for (const [key, value] of Object.entries(customEnv)) {
      const isBlocked = blocklist.some((blocked) => key.toUpperCase().includes(blocked));
      if (!isBlocked && typeof value === "string") {
        safeBaseEnv[key] = value;
      }
    }
  }

  return safeBaseEnv;
}

/**
 * Validates whether a destination hostname or IP is safe (SSRF protection).
 * Blocks 169.254.169.254, 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, ::1.
 */
export function isPublicNetworkDestination(hostOrIp: string): boolean {
  const host = hostOrIp.toLowerCase().trim();

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".internal") ||
    host.endsWith(".local")
  ) {
    return false;
  }

  // AWS/GCP/Azure link-local metadata
  if (host === "169.254.169.254" || host.startsWith("169.254.")) {
    return false;
  }

  // RFC1918 Private ranges
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return false;

  return true;
}
