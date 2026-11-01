import * as React from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Globe,
  Bot,
  Zap,
  Lock,
  Cpu,
  Layers,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { BotatoLogo, BotatoIcon } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LandingHeroDemo } from "@/components/landing-hero-demo";
import { LandingPlayground } from "@/components/landing-playground";
import { UserButton } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <BotatoLogo iconClassName="size-6" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-foreground transition-colors">
              Live Demo
            </a>
            <a href="#sandboxes" className="hover:text-foreground transition-colors">
              Sandboxes &amp; Browser
            </a>
            <a href="#mcp" className="hover:text-foreground transition-colors">
              Privacy &amp; MCP
            </a>
            <a href="#simulator" className="hover:text-foreground transition-colors">
              Playground
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {userId ? (
              <div className="flex items-center gap-3">
                <Button render={<Link href="/dashboard" />} size="sm" className="gap-1.5 font-medium">
                  <span>Go to Dashboard</span>
                  <ArrowRight className="size-3.5" />
                </Button>
                <UserButton />
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Button render={<Link href="/sign-in" />} variant="ghost" size="sm" className="text-xs sm:text-sm">
                  Sign in
                </Button>
                <Button render={<Link href="/sign-up" />} size="sm" className="gap-1 text-xs sm:text-sm">
                  <span>Start Free</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/15 via-primary/10 to-cyan-500/15 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-medium text-primary shadow-xs">
            <Zap className="size-3.5 text-primary animate-pulse" />
            <span>Autonomous Multi-Agent AI Teams • Built-in Cloud Sandboxes</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
            Stop Prompting Single Bots.{" "}
            <span className="bg-gradient-to-r from-purple-400 via-primary to-cyan-400 bg-clip-text text-transparent">
              Work with an AI Team.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Assign real tasks to persistent, specialized bots. Each bot gets its own isolated Linux sandbox, real interactive browser, compounding memory, and seamless group collaboration.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              render={<Link href={userId ? "/dashboard" : "/sign-up"} />}
              size="lg"
              className="w-full sm:w-auto h-11 px-6 text-sm sm:text-base font-semibold shadow-md gap-2"
            >
              <span>{userId ? "Open Dashboard" : "Start Building Free"}</span>
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-11 px-6 text-sm sm:text-base"
              render={<a href="#demo" />}
            >
              <span>Watch Interactive Demo</span>
            </Button>
          </div>

          {/* Social Proof / Stats Strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Cpu className="size-4 text-primary" />
              <span>Groq LPU Inference (480+ tok/s)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Container Hardware Isolation</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="size-4 text-purple-400" />
              <span>Zero-Leak MCP Privacy</span>
            </span>
          </div>

          {/* Interactive Hero Visual Showcase */}
          <div id="demo" className="pt-8 sm:pt-12 scroll-mt-20">
            <LandingHeroDemo />
          </div>
        </div>
      </section>

      {/* 4 Core Superpowers Bento Grid */}
      <section id="features" className="py-20 border-t border-border/80 bg-muted/20 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
              Platform Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Everything Your Autonomous Team Needs
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Botato moves past fragile prompt wrappers. Our bots operate on persistent Linux execution runtimes with compounding memory and live web navigation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs hover:border-primary/50 transition-colors">
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Bot className="size-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Multi-Agent Group Chats</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add 2 to 6 bots in one shared room. Mention teammates with <code className="font-mono bg-muted px-1 rounded">@Name</code>. Bots autonomously delegate tasks, consult peers asynchronously, and finalize work.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs hover:border-primary/50 transition-colors">
              <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Terminal className="size-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Dedicated Linux Sandboxes</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every bot has access to a secure execution container. Run Python, Node.js, bash scripts, and inspect file workspaces with zero risk to your host machine.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs hover:border-primary/50 transition-colors">
              <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Globe className="size-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Live Web Browser &amp; Proxy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Watch bots browse public documentation, inspect live websites, and cite real-world evidence. Built with strict SSRF defense and frame-ancestors protection.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs hover:border-primary/50 transition-colors">
              <div className="size-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Super Privacy &amp; Safe MCP</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect GitHub, Notion, Linear, or custom Model Context Protocol servers. Auth tokens are masked and shielded. Raw credentials never touch LLM prompts or chat logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Section: Sandboxes & Live Browser */}
      <section id="sandboxes" className="py-20 border-t border-border/80 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Terminal className="size-3.5" />
                <span>Isolated Compute Engine</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                A Real Computer for Every AI Teammate
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Standard AI chat apps force you to copy-paste scripts into your terminal manually. Botato gives your agents their own cloud workspace where they run tests, verify code syntax, format data, and store durable artifacts.
              </p>

              <div className="space-y-3 pt-2 text-sm text-foreground">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Persistent <code className="font-mono text-xs bg-muted px-1 rounded">MEMORY.md</code>:</strong> Bot remembers project conventions, preferred libraries, and rules across sessions.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Interactive Browser Omnibox:</strong> Jump to any URL, search DuckDuckGo, or view verified sources alongside the conversation.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Human Takeover:</strong> Step into the live browser whenever authentication, CAPTCHA, or final confirmation is required.
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Box */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border text-muted-foreground">
                <span className="text-foreground font-semibold">container-spec // sandbox-daemon</span>
                <span className="text-emerald-400">READY</span>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <div>&gt; Base Image: node:22-bookworm-slim</div>
                <div>&gt; Runtime Tools: bash, python3, pip, git, curl, jq</div>
                <div>&gt; Security: unprivileged non-root user (uid: 1001)</div>
                <div>&gt; Network: egress-controlled with SSRF filters</div>
                <div>&gt; Workspace Root: /workspaces/persistent</div>
              </div>
              <div className="pt-2 text-foreground font-sans text-xs bg-muted/40 p-3 rounded-lg border border-border/60">
                &ldquo;Because bots share workspace context, Ada can pull API documentation and save it to a local markdown file, and Linus can immediately execute tests against it.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Section: Privacy & MCP */}
      <section id="mcp" className="py-20 border-t border-border/80 bg-muted/20 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Visual Mock Card */}
            <div className="order-2 lg:order-1 rounded-2xl border border-emerald-500/30 bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <ShieldCheck className="size-5" />
                <span>Zero-Leak Credential Shield</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When you connect GitHub, Notion, or internal MCP tools, Botato proxies all tool calls through an isolated server layer.
              </p>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2.5 rounded-lg bg-background border border-border flex items-center justify-between">
                  <span className="text-foreground">GitHub MCP</span>
                  <span className="text-emerald-400 font-sans text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Active • Scoped
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-background border border-border flex items-center justify-between">
                  <span className="text-foreground">Notion Workspace</span>
                  <span className="text-emerald-400 font-sans text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Active • Scoped
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                🔒 Strict SSRF Defense: Private subnets (127.0.0.1, 10.x, 192.168.x, 169.254.169.254) are rejected before network requests are dispatched.
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-5">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                <Lock className="size-3.5" />
                <span>Enterprise Privacy Standard</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Connect Apps Safely with Model Context Protocol
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Connect any of the thousands of MCP servers in the ecosystem. Your bots can read GitHub issues, update Jira/Linear tasks, query Postgres databases, and draft Notion documents—without ever exposing your credentials to the LLM.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["GitHub", "Notion", "Linear", "Slack", "PostgreSQL", "Custom REST"].map((app) => (
                  <span
                    key={app}
                    className="text-xs px-2.5 py-1 rounded-md bg-card border border-border text-foreground font-medium"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Simulator / Playground Section */}
      <section id="simulator" className="py-20 border-t border-border/80 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
              Interactive Playground
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Test Drive Multi-Agent Collaboration
            </h2>
            <p className="text-sm text-muted-foreground">
              Experience the sub-second speed of Groq LPU inference and autonomous sandbox verification.
            </p>
          </div>

          <LandingPlayground />
        </div>
      </section>

      {/* Comparison Table: Traditional AI Chat vs Botato */}
      <section className="py-20 border-t border-border/80 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              How Botato Compares
            </h2>
            <p className="text-sm text-muted-foreground">
              See why high-velocity teams choose persistent agent teams over prompt playgrounds.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-muted/60 text-muted-foreground border-b border-border text-xs uppercase font-mono">
                <tr>
                  <th className="p-3.5 sm:p-4">Capability</th>
                  <th className="p-3.5 sm:p-4 text-muted-foreground">Single AI Chatbots</th>
                  <th className="p-3.5 sm:p-4 text-primary font-bold">Botato Agent Teams</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium text-foreground">Execution Environment</td>
                  <td className="p-3.5 sm:p-4 text-muted-foreground">Text drafts only (no execution)</td>
                  <td className="p-3.5 sm:p-4 text-emerald-400 font-semibold">Dedicated Linux sandbox (bash + python)</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium text-foreground">Web Navigation</td>
                  <td className="p-3.5 sm:p-4 text-muted-foreground">Static search snippet only</td>
                  <td className="p-3.5 sm:p-4 text-emerald-400 font-semibold">Interactive live browser with omnibox</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium text-foreground">Team Collaboration</td>
                  <td className="p-3.5 sm:p-4 text-muted-foreground">1 bot at a time</td>
                  <td className="p-3.5 sm:p-4 text-emerald-400 font-semibold">Group chats with @mentions &amp; handoffs</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium text-foreground">Context Retention</td>
                  <td className="p-3.5 sm:p-4 text-muted-foreground">Resets on new conversation</td>
                  <td className="p-3.5 sm:p-4 text-emerald-400 font-semibold">Persistent compounding MEMORY.md</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-medium text-foreground">External Tools</td>
                  <td className="p-3.5 sm:p-4 text-muted-foreground">Proprietary / Closed</td>
                  <td className="p-3.5 sm:p-4 text-emerald-400 font-semibold">Open Model Context Protocol (MCP)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 border-t border-border/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-purple-600/10 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary shadow-sm">
            <BotatoIcon className="size-10" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Ready to Build Your Autonomous AI Team?
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Spin up your first bot team in seconds. Enjoy dedicated cloud sandboxes, persistent memory, and live browser automation.
          </p>

          <div className="pt-2">
            <Button
              render={<Link href={userId ? "/dashboard" : "/sign-up"} />}
              size="lg"
              className="h-12 px-8 text-base font-semibold shadow-xl gap-2"
            >
              <span>{userId ? "Go to Your Dashboard" : "Get Started for Free"}</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="border-t border-border/80 bg-background py-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BotatoLogo iconClassName="size-4.5" />
            <span>— The Multi-Agent Autonomous Workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="size-3" />
            </a>
            <Link href="/sign-in" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
