"use client";

import * as React from "react";
import { Sparkles, ArrowRight, Zap, Bot, Terminal, Globe, Check } from "lucide-react";
import { ChatAvatar } from "@/components/chat-avatar";
import Link from "next/link";

const SAMPLE_SCENARIOS = [
  {
    label: "Security Audit",
    prompt: "@Linus inspect our web endpoints for missing security headers in the sandbox.",
    bot: "Linus",
    role: "Code Reviewer",
    response:
      "I've initialized the sandbox environment and executed a curl header check against the test endpoint. Strict-Transport-Security (HSTS) and Content-Security-Policy headers are verified and clean. No open vulnerabilities detected.",
    tool: "executeCommand: python3 test_headers.py",
  },
  {
    label: "Market Research",
    prompt: "@Ada research the latest developments in AI agents and write a concise briefing.",
    bot: "Ada",
    role: "Research Assistant",
    response:
      "I browsed the latest documentation and industry papers. Multi-agent teams with shared persistent memory are showing 3.4x higher task completion rates compared to single prompt-response assistants. I have summarized the top 3 frameworks and updated MEMORY.md.",
    tool: "browseWeb: https://en.wikipedia.org/wiki/Autonomous_agent",
  },
  {
    label: "MCP App Integration",
    prompt: "Connect GitHub MCP and list all open critical issues.",
    bot: "Botato",
    role: "Chief of Staff",
    response:
      "Connected to GitHub MCP with zero-leak privacy token masking. Discovered 12 available tools: github_list_issues, github_create_pr, github_search_code. Scanned repository: 0 critical vulnerabilities reported.",
    tool: "mcp_list_issues: { state: 'open', severity: 'critical' }",
  },
];

export function LandingPlayground() {
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const current = SAMPLE_SCENARIOS[selectedIdx];

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span>Interactive Multi-Bot Simulator</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a real-world scenario to see how Botato bots orchestrate tools and sandbox memory.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
          <Zap className="size-3 text-primary animate-pulse" />
          <span>Groq LPU Engine Active</span>
        </div>
      </div>

      {/* Preset Scenario Selector */}
      <div className="flex flex-wrap gap-2">
        {SAMPLE_SCENARIOS.map((scenario, idx) => (
          <button
            key={scenario.label}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
              selectedIdx === idx
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      {/* Mock Chat Box */}
      <div className="rounded-xl border border-border/70 bg-background/90 p-4 space-y-3 font-sans">
        {/* User Prompt */}
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl bg-secondary px-3.5 py-2 text-xs sm:text-sm text-secondary-foreground">
            {current.prompt}
          </div>
        </div>

        {/* Bot Response */}
        <div className="flex items-start gap-3">
          <ChatAvatar seed={current.bot} className="size-8 rounded-lg shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{current.bot}</span>
              <span className="text-[11px] text-muted-foreground font-mono">({current.role})</span>
            </div>

            {/* Simulated Tool execution step */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/70 border border-border text-[11px] font-mono text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span className="text-foreground">Tool Executed:</span>
              <span className="truncate">{current.tool}</span>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {current.response}
            </p>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 font-mono text-emerald-400">
                <Check className="size-3" />
                <span>Verified in isolated container</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          Ready to run your own custom bots and MCP tools?
        </span>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <span>Start free with Botato</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
