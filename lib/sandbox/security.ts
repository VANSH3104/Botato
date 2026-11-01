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

