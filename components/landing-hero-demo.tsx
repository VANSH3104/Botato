"use client";

import * as React from "react";
import {
  Terminal,
  Globe,
  Sparkles,
  Bot,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Zap,
} from "lucide-react";
import { ChatAvatar } from "@/components/chat-avatar";

export function LandingHeroDemo() {
  const [activeTab, setActiveTab] = React.useState<"group" | "browser" | "sandbox">("group");
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText("npx botato-agent init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-border/80 bg-card/90 shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Top Window Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-xs font-mono text-muted-foreground ml-2 hidden sm:inline">
            botato-workspace // multi-agent-orchestrator
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-background border border-border/70 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("group")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === "group"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bot className="size-3.5" />
            <span>Group Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("browser")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === "browser"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="size-3.5" />
            <span>Live Browser</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sandbox")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === "sandbox"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Terminal className="size-3.5" />
            <span>Linux Sandbox</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LPU: 480 tok/s</span>
        </div>
      </div>

      {/* Main Interactive Demo Area */}
      <div className="p-4 sm:p-6 min-h-[380px] flex flex-col justify-between">
        {activeTab === "group" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl bg-secondary px-4 py-2.5 text-xs sm:text-sm text-secondary-foreground shadow-xs">
                <span>
                  <span className="font-semibold text-primary">@Ada</span> analyze the latest OWASP Top 10 vulnerabilities, and then{" "}
                  <span className="font-semibold text-primary">@Linus</span> write a security audit script in the sandbox.
                </span>
              </div>
            </div>

            {/* Ada's Turn */}
            <div className="flex items-start gap-3">
              <ChatAvatar seed="Ada" className="size-8 rounded-lg shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5 text-xs sm:text-sm text-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-foreground">Ada</span>
                  <span className="text-[10px] text-muted-foreground">(Research Assistant)</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  I reviewed the latest OWASP guidance. The primary risks for modern apps remain Broken Access Control (A01) and Cryptographic Failures (A02). I&apos;ve extracted the test endpoints and added verified rules to our shared <code className="font-mono text-xs bg-muted px-1 rounded">MEMORY.md</code>.
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-primary">
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 font-mono">
                    🤝 Handed off to @Linus for sandbox test
                  </span>
                </div>
              </div>
            </div>

            {/* Linus's Turn */}
            <div className="flex items-start gap-3">
              <ChatAvatar seed="Linus" className="size-8 rounded-lg shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5 text-xs sm:text-sm text-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-foreground">Linus</span>
                  <span className="text-[10px] text-muted-foreground">(Code Reviewer)</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Got it Ada. I just created <code className="font-mono text-xs bg-muted px-1 rounded">audit_headers.py</code> in the persistent sandbox and ran verification:
                </p>
                <div className="font-mono text-[11px] bg-background/90 p-2.5 rounded-lg border border-border text-emerald-400 space-y-1">
                  <div>$ python3 audit_headers.py --target https://app.internal</div>
                  <div className="text-muted-foreground">✓ Strict-Transport-Security: Present</div>
                  <div className="text-muted-foreground">✓ Content-Security-Policy: frame-ancestors &apos;self&apos;</div>
                  <div className="text-emerald-300">✓ 0 Critical vulnerabilities detected in sandbox check.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "browser" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Omnibox mockup */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-mono text-foreground">
              <Globe className="size-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-400">https://</span>
              <span className="text-foreground">en.wikipedia.org/wiki/Autonomous_agent</span>
              <span className="ml-auto text-[10px] text-muted-foreground font-sans px-1.5 py-0.5 rounded bg-muted">
                Proxy Active (SSRF Shielded)
              </span>
            </div>

            {/* Browser preview pane */}
            <div className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="border-b border-border pb-2 flex items-center justify-between">
                <div className="font-serif text-lg font-bold text-foreground">Autonomous Agent</div>
                <span className="text-xs font-mono text-muted-foreground">Wikipedia / Live View</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An <strong>intelligent agent</strong> or <strong>autonomous agent</strong> is an entity that perceives its environment through sensors, acts upon that environment through effectors, and directs its activity toward achieving goals.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                  ✓ Interactive click & navigation enabled
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                  ✓ Zero CORS / Frame blocking
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                  ✓ Bot extracts citations automatically
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sandbox" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Terminal header */}
            <div className="flex items-center justify-between font-mono text-xs text-muted-foreground px-1">
              <span>sandbox-runtime // container-isolated</span>
              <span>Linux 6.6-amd64 • bash 5.2</span>
            </div>

            {/* Terminal shell preview */}
            <div className="rounded-xl bg-black/90 p-4 font-mono text-xs text-foreground space-y-2 border border-border/80 shadow-inner">
              <div className="text-muted-foreground"># Botato Sandbox Daemon connected (port 4000)</div>
              <div>
                <span className="text-emerald-400">sandbox@botato</span>:<span className="text-blue-400">/workspace</span>$ ls -la
              </div>
              <div className="text-muted-foreground pl-2 text-[11px] space-y-0.5">
                <div>-rw-r--r-- 1 sandbox sandbox  284 Oct 31 12:00 MEMORY.md</div>
                <div>-rw-r--r-- 1 sandbox sandbox 1024 Oct 31 12:02 test_api.ts</div>
                <div>drwxr-xr-x 4 sandbox sandbox  128 Oct 31 12:03 reports/</div>
              </div>
              <div>
                <span className="text-emerald-400">sandbox@botato</span>:<span className="text-blue-400">/workspace</span>$ cat MEMORY.md
              </div>
              <div className="text-amber-300 pl-2 text-[11px]">
                # Memory for Ada &amp; Linus
                - User prefers Tailwind CSS v4 and strict TypeScript.
                - Production deploy target: Railway container with Private Networking.
              </div>
            </div>
          </div>
        )}

        {/* Bottom Interactive Feature Bar */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span>Dedicated isolated container per user • Never leaks host filesystem</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] bg-muted px-2 py-1 rounded border border-border text-foreground">
              npx botato-agent init
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy CLI command"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
