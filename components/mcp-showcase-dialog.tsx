"use client";

import * as React from "react";
import {
  Search,
  Plus,
  X,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Code2,
  Database,
  Lock,
  Copy,
  Check,
  CreditCard,
  Bug,
  Cloud,
  Server,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface McpShowcaseCard {
  id: string;
  name: string;
  category: "all" | "search" | "productivity" | "developer";
  categoryLabel: string;
  url: string;
  headerKey?: string;
  headerPlaceholder?: string;
  keyGuide?: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  badgeLabel?: string;
  tools?: string[];
}

export const SHOWCASE_CARDS: McpShowcaseCard[] = [
  {
    id: "neon-postgres",
    name: "Neon Postgres",
    category: "developer",
    categoryLabel: "Dev Tools",
    url: "https://mcp.neon.tech/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer neon_...",
    keyGuide: "API Key from Neon Console (console.neon.tech)",
    desc: "Inspect Postgres tables, run queries, and manage database branches.",
    icon: Database,
    accentBg: "bg-cyan-500/10",
    accentText: "text-cyan-500 dark:text-cyan-400",
    accentBorder: "border-cyan-500/30",
    badgeLabel: "Official MCP",
    tools: ["postgres_inspect_schema", "postgres_query_read_only", "neon_list_branches"],
  },
  {
    id: "supabase-db",
    name: "Supabase Database",
    category: "developer",
    categoryLabel: "Dev Tools",
    url: "https://mcp.supabase.com/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer sbp_...",
    keyGuide: "Personal Access Token from supabase.com/dashboard/account/tokens",
    desc: "Query Postgres database, inspect schemas, and view storage buckets.",
    icon: Database,
    accentBg: "bg-emerald-500/10",
    accentText: "text-emerald-500 dark:text-emerald-400",
    accentBorder: "border-emerald-500/30",
    badgeLabel: "Official MCP",
    tools: ["supabase_query", "supabase_inspect_tables", "supabase_list_buckets"],
  },
  {
    id: "stripe-billing",
    name: "Stripe Billing & Payments",
    category: "developer",
    categoryLabel: "Dev Tools",
    url: "https://mcp.stripe.com",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer rk_live_...",
    keyGuide: "Restricted or Secret key from dashboard.stripe.com/apikeys",
    desc: "Inspect customers, retrieve invoices, track subscriptions, and check balances.",
    icon: CreditCard,
    accentBg: "bg-indigo-500/10",
    accentText: "text-indigo-500 dark:text-indigo-400",
    accentBorder: "border-indigo-500/30",
    badgeLabel: "Official MCP",
    tools: ["stripe_search_customers", "stripe_list_invoices", "stripe_get_balance"],
  },
  {
    id: "sentry-issues",
    name: "Sentry Error Tracking",
    category: "developer",
    categoryLabel: "Dev Tools",
    url: "https://mcp.sentry.io",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer sntrys_...",
    keyGuide: "User Auth Token from sentry.io/settings/account/api/auth-tokens",
    desc: "Query production issues, fetch crash stack traces, and review releases.",
    icon: Bug,
    accentBg: "bg-rose-500/10",
    accentText: "text-rose-500 dark:text-rose-400",
    accentBorder: "border-rose-500/30",
    badgeLabel: "Official MCP",
    tools: ["sentry_query_issues", "sentry_get_stacktrace", "sentry_release_health"],
  },
  {
    id: "notion-workspace",
    name: "Notion Workspace",
    category: "productivity",
    categoryLabel: "Productivity",
    url: "https://mcp.notion.com/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer secret_...",
    keyGuide: "Internal Integration Secret from notion.so/my-integrations",
    desc: "Search pages, read workspace documents in markdown, and update databases.",
    icon: FileText,
    accentBg: "bg-stone-500/10",
    accentText: "text-stone-700 dark:text-stone-300",
    accentBorder: "border-stone-500/30",
    badgeLabel: "Official MCP",
    tools: ["notion_search", "notion_read_page", "notion_update_database"],
  },
  {
    id: "linear-tasks",
    name: "Linear Tasks",
    category: "developer",
    categoryLabel: "Dev Tools",
    url: "https://mcp.linear.app/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer lin_api_...",
    keyGuide: "Personal API key from Linear Settings > Account > API",
    desc: "Track issues, update sprints, and create backlog tasks.",
    icon: CheckCircle2,
    accentBg: "bg-indigo-500/10",
    accentText: "text-indigo-500 dark:text-indigo-400",
    accentBorder: "border-indigo-500/30",
    badgeLabel: "Official MCP",
    tools: ["linear_search_issues", "linear_update_issue", "linear_create_task"],
  },
  {
    id: "brave-search",
    name: "Brave Live Search",
    category: "search",
    categoryLabel: "Search & Web",
    url: "https://api.search.brave.com/res/v1/mcp",
    headerKey: "X-Subscription-Token",
    headerPlaceholder: "BSA...",
    keyGuide: "Get a free API key at brave.com/search/api",
    desc: "Search the live web, current news, breaking updates, and web articles.",
    icon: Search,
    accentBg: "bg-amber-500/10",
    accentText: "text-amber-500 dark:text-amber-400",
    accentBorder: "border-amber-500/30",
    badgeLabel: "Official MCP",
    tools: ["brave_web_search", "brave_news_search", "brave_local_search"],
  },
  {
    id: "cloudflare-infra",
    name: "Cloudflare Infrastructure",
    category: "developer",
    categoryLabel: "Dev Tools",
    url: "https://mcp.cloudflare.com/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer ...",
    keyGuide: "API Token with Workers & KV permissions from dash.cloudflare.com",
    desc: "Manage Cloudflare Workers, KV namespaces, DNS records, and R2 buckets.",
    icon: Cloud,
    accentBg: "bg-orange-500/10",
    accentText: "text-orange-500 dark:text-orange-400",
    accentBorder: "border-orange-500/30",
    badgeLabel: "Official MCP",
    tools: ["cloudflare_list_workers", "cloudflare_kv_get", "cloudflare_dns_records"],
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot MCP",
    category: "developer",
    categoryLabel: "Dev Tools",
    url: "https://api.githubcopilot.com/mcp/",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer ghp_...",
    keyGuide: "Personal access token with repo scope from github.com/settings/tokens",
    desc: "Inspect repositories, search pull requests, check diffs, and review issues.",
    icon: Code2,
    accentBg: "bg-violet-500/10",
    accentText: "text-violet-500 dark:text-violet-400",
    accentBorder: "border-violet-500/30",
    badgeLabel: "Official MCP",
    tools: ["github_review_diff", "github_triage_issue", "github_create_pr"],
  },
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "developer", label: "Dev Tools" },
  { id: "productivity", label: "Productivity" },
  { id: "search", label: "Search & Web" },
] as const;

export interface McpShowcaseDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  botName?: string;
  trigger?: React.ReactNode;
}

export function McpShowcaseDialog({
  open,
  onOpenChange,
  botName = "Ada",
  trigger,
}: McpShowcaseDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [selectedCard, setSelectedCard] = React.useState<McpShowcaseCard | null>(SHOWCASE_CARDS[0]); // Default Neon Postgres
  const [showCustomServerForm, setShowCustomServerForm] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const filteredCards = React.useMemo(() => {
    return SHOWCASE_CARDS.filter((card) => {
      const matchesCategory =
        activeCategory === "all" || card.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        card.name.toLowerCase().includes(q) ||
        card.desc.toLowerCase().includes(q) ||
        card.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const content = (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/60">
        <div>
          <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Model Context Protocol Showcase
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-[13px] text-muted-foreground mt-1">
            Connect verified official remote MCP servers so {botName} can query live data and execute actions.
          </DialogDescription>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCustomServerForm(!showCustomServerForm)}
          className="h-8 gap-1.5 text-xs font-medium shrink-0 self-start sm:self-auto border-border/80 hover:border-primary/50 cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>{showCustomServerForm ? "Browse Catalog" : "Custom Server"}</span>
        </Button>
      </div>

      {/* Custom Server Drawer */}
      {showCustomServerForm ? (
        <div className="rounded-2xl border border-border/80 bg-background/90 p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Server className="size-4 text-primary" />
            <span>Connect Any Remote Model Context Protocol Server</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Botato supports any HTTP or SSE server adhering to the Anthropic Model Context Protocol specification. Schemas and callable tools are queried dynamically via JSON-RPC 2.0.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-muted-foreground">Server Name</label>
              <input
                type="text"
                placeholder="e.g. My Internal Microservice"
                className="w-full h-9 px-3 rounded-lg border border-border/80 bg-card text-foreground"
                readOnly
                value="Custom Enterprise Gateway"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground">Endpoint URL (HTTP / SSE)</label>
              <input
                type="text"
                placeholder="https://mcp.your-domain.com/v1"
                className="w-full h-9 px-3 rounded-lg border border-border/80 bg-card text-foreground"
                readOnly
                value="https://mcp.your-domain.com/v1"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0" />
            <span>Zero-Token Proxy active: Bearer headers are encrypted and injected server-side.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustomServerForm(false)}
            >
              Back to Catalog
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Search Bar & Category Filter Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search verified MCP servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 pl-8.5 pr-8 text-xs rounded-xl border-border/70 bg-background/80 placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Category Filter Dropdown */}
            <Select
              value={activeCategory}
              onValueChange={(val) => {
                if (typeof val === "string") setActiveCategory(val);
              }}
            >
              <SelectTrigger className="h-8.5 w-full sm:w-[150px] shrink-0 text-xs rounded-xl bg-background/80 border-border/70">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false} className="text-xs">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-xs">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Real MCP Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[52vh] sm:max-h-[58vh] overflow-y-auto pr-1">
            {filteredCards.length === 0 ? (
              <div className="col-span-full py-10 text-center text-muted-foreground space-y-2">
                <p className="text-xs">No MCP servers found matching &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredCards.map((card) => {
                const Icon = card.icon;
                const isSelected = selectedCard?.id === card.id;

                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`group relative flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left shadow-2xs ${
                      isSelected
                        ? "border-primary/60 bg-muted/30 ring-1 ring-primary/40 shadow-sm"
                        : "border-border/70 bg-card/60 hover:bg-muted/40 hover:border-primary/40"
                    }`}
                  >
                    {/* Brand / App Icon */}
                    <div
                      className={`size-10 rounded-xl ${card.accentBg} ${card.accentBorder} border flex items-center justify-center ${card.accentText} shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs`}
                    >
                      <Icon className="size-5" />
                    </div>

                    {/* App Content */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-semibold text-xs sm:text-[13px] text-foreground group-hover:text-primary transition-colors truncate">
                          {card.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-medium border border-emerald-500/20 shrink-0">
                          {card.badgeLabel ?? "Official MCP"}
                        </span>
                      </div>

                      <p className="text-[11.5px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {card.desc}
                      </p>

                      <div className="pt-1.5 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground/75 font-mono text-[10.5px]">
                          {card.categoryLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-foreground group-hover:text-primary transition-colors">
                          <span>Connect</span>
                          <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Card Quick Configuration Drawer */}
          {selectedCard && (
            <div className="rounded-xl border border-border/80 bg-background/95 p-3.5 space-y-2.5 text-xs shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`size-6 rounded-lg ${selectedCard.accentBg} ${selectedCard.accentBorder} border flex items-center justify-center ${selectedCard.accentText}`}
                  >
                    <selectedCard.icon className="size-3.5" />
                  </div>
                  <span className="font-semibold text-foreground">
                    {selectedCard.name} • Official Endpoint
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(selectedCard.url)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border/70 hover:bg-muted cursor-pointer transition-colors"
                  >
                    {copiedUrl ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    <span>{copiedUrl ? "Copied" : "Copy URL"}</span>
                  </button>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Zero-Leak Shield
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/60">
                <span className="truncate">URL: {selectedCard.url}</span>
                {selectedCard.headerKey && (
                  <span className="text-foreground shrink-0">
                    Header: {selectedCard.headerKey} ({selectedCard.headerPlaceholder ?? "Encrypted"})
                  </span>
                )}
              </div>

              {selectedCard.keyGuide && (
                <div className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">Auth: </span>
                  {selectedCard.keyGuide}
                </div>
              )}

              {selectedCard.tools && selectedCard.tools.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10.5px] text-muted-foreground mr-1">Discovered Tools:</span>
                  {selectedCard.tools.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-card border border-border text-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Callout */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Lock className="size-3 shrink-0" />
              <span>SSRF Defense Active • Real JSON-RPC 2.0 endpoints</span>
            </div>
            <span>Anthropic Model Context Protocol Standard</span>
          </div>
        </>
      )}
    </div>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <div onClick={() => setOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </div>
        <DialogContent
          className="sm:max-w-3xl md:max-w-4xl p-4 sm:p-6 bg-card/95 backdrop-blur-xl border-border/90 max-h-[92vh] overflow-hidden"
          showCloseButton
        >
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-3xl md:max-w-4xl p-4 sm:p-6 bg-card/95 backdrop-blur-xl border-border/90 max-h-[92vh] overflow-hidden"
        showCloseButton
      >
        {content}
      </DialogContent>
    </Dialog>
  );
}

