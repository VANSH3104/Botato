import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isPublicNetworkDestination } from "@/lib/sandbox/security";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;padding:3rem 1.5rem;background:#0d0d0d;color:#eee;text-align:center;">
        <h3 style="margin-bottom:0.5rem;font-size:1.125rem;">Authentication Required</h3>
        <p style="color:#a1a1aa;font-size:0.875rem;max-width:320px;margin:0 auto 1.5rem;">Please log in to your Botato account to view and navigate the Live Browser.</p>
        <a href="/sign-in" style="display:inline-block;padding:0.5rem 1rem;background:#2563eb;color:#fff;border-radius:0.375rem;text-decoration:none;font-size:0.875rem;font-weight:500;">Sign in to Botato</a>
      </body></html>`,
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  // Enforce SSRF protection
  if (!isPublicNetworkDestination(parsed.hostname)) {
    return new NextResponse("Forbidden: Access to private networks is blocked", { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let finalUrl = parsed.toString();
    let res = await fetch(finalUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 BotatoBrowser/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);
    finalUrl = res.url || finalUrl;

    let contentType = res.headers.get("content-type") || "text/html";

    // For non-HTML assets (images, css, js) stream directly
    if (!contentType.includes("text/html")) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: res.status,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    let html = await res.text();

    // Handle meta-refresh redirects (e.g. OWASP docs, documentation landing pages)
    const metaRefreshMatch = html.match(
      /<meta[^>]*http-equiv=["']?refresh["']?[^>]*content=["']?[^"'>]*url=([^"'>\s]+)["']?/i
    );
    if (metaRefreshMatch && metaRefreshMatch[1]) {
      try {
        const refreshTarget = new URL(metaRefreshMatch[1], finalUrl);
        if (isPublicNetworkDestination(refreshTarget.hostname)) {
          finalUrl = refreshTarget.toString();
          const refreshRes = await fetch(finalUrl, {
            redirect: "follow",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 BotatoBrowser/1.0",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
          });
          finalUrl = refreshRes.url || finalUrl;
          const refreshType = refreshRes.headers.get("content-type") || "text/html";
          if (refreshType.includes("text/html")) {
            html = await refreshRes.text();
          }
        }
      } catch {
        // Fall back to original HTML
      }
    }

    // Strip client-side meta refresh and CSP tags so they don't block the iframe
    html = html.replace(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*>/gi, "");
    html = html.replace(/<meta[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, "");

    // Inject base tag with final URL so relative links, styles, and assets resolve accurately
    const baseTag = `<base href="${finalUrl}">`;
    const proxyScript = `<script>
(function() {
  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a && a.href && !a.href.startsWith('javascript:') && !a.href.startsWith('#')) {
      e.preventDefault();
      window.location.href = '/api/browser/proxy?url=' + encodeURIComponent(a.href);
    }
  }, true);
})();
</script>`;

    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${baseTag}${proxyScript}`);
    } else if (html.includes("<HEAD>")) {
      html = html.replace("<HEAD>", `<HEAD>${baseTag}${proxyScript}`);
    } else {
      html = baseTag + proxyScript + html;
    }

    // Strip frame-busting scripts if present
    html = html.replace(/top\.location\s*=\s*self\.location/gi, "");
    html = html.replace(/if\s*\(top\s*!==\s*self\)\s*top\.location\s*=\s*self\.location/gi, "");

    return new NextResponse(html, {
      status: res.status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Crucial: remove X-Frame-Options and permit iframe embedding within our app
        "X-Frame-Options": "ALLOWALL",
        "Content-Security-Policy": "frame-ancestors 'self'",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load webpage";
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;background:#111;color:#eee;">
        <h2>Failed to load webpage</h2>
        <p style="color:#ef4444;">${message}</p>
        <p>URL: <code>${targetUrl}</code></p>
      </body></html>`,
      {
        status: 502,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
