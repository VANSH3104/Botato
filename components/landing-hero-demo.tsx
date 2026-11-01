"use client";

import * as React from "react";
import Image from "next/image";
import {
  ShieldCheck,
  Check,
  Copy,
  Terminal,
  Globe,
  Bot,
  Layers,
  ExternalLink,
} from "lucide-react";
import { GitHubIcon } from "@/components/logo";

export function LandingHeroDemo() {
  const [copied, setCopied] = React.useState(false);

  const handleCopyClone = () => {
    navigator.clipboard.writeText("git clone https://github.com/VANSH3104/Botato.git");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto group">
      {/* Ambient Radial Glow Behind the UI Mockup */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-500/25 via-primary/30 to-cyan-500/25 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Main UI Window Container */}
      <div className="relative rounded-2xl border border-border/80 bg-card/95 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Top Window Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-xs font-mono text-muted-foreground ml-2 hidden sm:inline">
              botato // autonomous-workspace (active-session)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Workspace • Ready</span>
            </span>

            <a
              href="https://github.com/VANSH3104/Botato"
              target="_blank"
              rel="noreferrer noopener"
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors ml-2"
            >
              <GitHubIcon className="size-3.5" />
              <span>VANSH3104/Botato</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        {/* UI Screenshot Showcase */}
        <div className="relative w-full bg-black/60 overflow-hidden">
          <div className="relative aspect-[16/9.5] w-full max-h-[620px] overflow-hidden">
            <Image
              src="/botato-chat.png"
              alt="Botato Autonomous AI Team Chat & Sandbox Interface"
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1100px"
              className="object-cover object-top select-none transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />
          </div>

          {/* Floating Feature Badges */}
          <div className="absolute top-3 left-3 hidden sm:flex items-center gap-2 bg-background/85 backdrop-blur-md border border-border/80 rounded-xl px-3 py-1.5 text-xs shadow-lg">
            <Bot className="size-4 text-primary" />
            <span className="font-medium text-foreground">Multi-Bot Group Channels</span>
          </div>

          <div className="absolute top-3 right-3 hidden sm:flex items-center gap-2 bg-background/85 backdrop-blur-md border border-border/80 rounded-xl px-3 py-1.5 text-xs shadow-lg">
            <Globe className="size-4 text-emerald-400" />
            <span className="font-medium text-foreground">Interactive Live Browser</span>
          </div>

          <div className="absolute bottom-4 left-3 hidden sm:flex items-center gap-2 bg-background/85 backdrop-blur-md border border-border/80 rounded-xl px-3 py-1.5 text-xs shadow-lg">
            <Terminal className="size-4 text-amber-400" />
            <span className="font-medium text-foreground">Isolated Linux Sandbox</span>
          </div>

          <div className="absolute bottom-4 right-3 hidden sm:flex items-center gap-2 bg-background/85 backdrop-blur-md border border-border/80 rounded-xl px-3 py-1.5 text-xs shadow-lg">
            <Layers className="size-4 text-cyan-400" />
            <span className="font-medium text-foreground">Model Context Protocol (MCP)</span>
          </div>
        </div>

        {/* Bottom Interactive Feature Bar with GitHub Link */}
        <div className="p-3.5 sm:px-5 sm:py-3.5 border-t border-border bg-card/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span>Dedicated isolated container per user • Never leaks host filesystem</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/VANSH3104/Botato"
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono text-[11px] bg-muted px-2.5 py-1 rounded-md border border-border text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1.5"
            >
              <span>git clone https://github.com/VANSH3104/Botato.git</span>
            </a>
            <button
              type="button"
              onClick={handleCopyClone}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy Git clone command"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
