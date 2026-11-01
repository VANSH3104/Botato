"use client";

import * as React from "react";
import {
  ShieldCheck,
  Plus,
  Trash2,
  RefreshCw,
  Server,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  FileText,
  Database,
  Code2,
  ArrowRight,
  Zap,
  Check,
  X,
  Copy,
  CreditCard,
  Bug,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listMcpServers,
  createMcpServer,
  testMcpServer,
  toggleMcpServer,
  deleteMcpServer,
} from "@/actions/mcp";

interface McpServerItem {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  transport?: string;
  botId?: string | null;
  isEnabled: boolean;
  maskedHeaders?: Record<string, string>;
}

export interface McpTemplate {
  name: string;
  category: "productivity" | "search" | "developer";
  categoryLabel: string;
  url: string;
  headerKey?: string;
  headerPlaceholder?: string;
  keyGuide?: string;
  isFree?: boolean;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentBg: string;
  accentText: string;
  accentBorder: string;
}

export const MCP_TEMPLATES: McpTemplate[] = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
    name: "Cloudflare Infrastructure",
    category: "developer",
    categoryLabel: "Dev Tools",
    url: "https://mcp.cloudflare.com/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer ...",
    keyGuide: "API Token with Workers and KV permissions from dash.cloudflare.com",
    desc: "Manage Cloudflare Workers, KV namespaces, DNS records, and R2 buckets.",
    icon: Cloud,
    accentBg: "bg-orange-500/10",
    accentText: "text-orange-500 dark:text-orange-400",
    accentBorder: "border-orange-500/30",
  },
  {
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
  },
];

export function McpSettings({
  botId,
  botName,
}: {
  botId?: string;
  botName?: string;
}) {
  const [servers, setServers] = React.useState<McpServerItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAdding, setIsAdding] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // New server form
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [authHeader, setAuthHeader] = React.useState("");
  const [activeGuide, setActiveGuide] = React.useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = React.useState<McpTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [testResults, setTestResults] = React.useState<Record<string, { success: boolean; message: string }>>({});
  const [copiedUrlId, setCopiedUrlId] = React.useState<string | null>(null);

  const loadServers = React.useCallback(async () => {
    try {
      const res = await listMcpServers(botId);
      if (res.success && res.servers) {
        setServers(res.servers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [botId]);

  React.useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await listMcpServers(botId);
        if (!ignore && res.success && res.servers) {
          setServers(res.servers);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [botId]);

  const handleApplyTemplate = (tpl: McpTemplate) => {
    setActiveTemplate(tpl);
    setName(tpl.name);
    setUrl(tpl.url);
    setActiveGuide(tpl.keyGuide ?? (tpl.isFree ? "Free public MCP server: No API key required." : null));
    setAuthHeader("");
    setIsAdding(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = {};
      if (authHeader.trim()) {
        const headerKey = activeTemplate?.headerKey || "Authorization";
        if (headerKey === "Authorization") {
          headers["Authorization"] = authHeader.trim().startsWith("Bearer ")
            ? authHeader.trim()
            : `Bearer ${authHeader.trim()}`;
        } else {
          headers[headerKey] = authHeader.trim();
        }
      }

      const res = await createMcpServer({
        name: name.trim(),
        url: url.trim(),
        botId: botId || null,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        isEnabled: true,
      });

      if (res.success) {
        toast.add({
          title: "App Connected",
          description: `"${name}" connected with zero-leak privacy guards.`,
        });
        setName("");
        setUrl("");
        setAuthHeader("");
        setActiveGuide(null);
        setActiveTemplate(null);
        setIsAdding(false);
        await loadServers();
      } else {
        toast.add({
          type: "error",
          title: "Connection Failed",
          description: res.error || "Could not connect to MCP server.",
        });
      }
    } catch (error) {
      toast.add({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await testMcpServer(id);
      if (res.success) {
        setTestResults((prev) => ({
          ...prev,
          [id]: {
            success: true,
            message: `Verified: ${res.toolCount ?? 0} tool${(res.toolCount ?? 0) === 1 ? "" : "s"} ready.`,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [id]: {
            success: false,
            message: res.error || "Connection test failed",
          },
        }));
      }
    } finally {
      setTestingId(null);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleMcpServer(id, !current);
      setServers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isEnabled: !current } : s))
      );
    } catch {
      toast.add({ type: "error", title: "Failed to update state" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMcpServer(id);
      setServers((prev) => prev.filter((s) => s.id !== id));
      toast.add({ title: "MCP Server removed" });
    } catch {
      toast.add({ type: "error", title: "Failed to delete server" });
    }
  };

  const handleCopyUrl = (id: string, serverUrl: string) => {
    navigator.clipboard.writeText(serverUrl);
    setCopiedUrlId(id);
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  const filteredTemplates = React.useMemo(() => {
    return MCP_TEMPLATES.filter((tpl) => {
      const matchesCategory =
        activeCategory === "all" || tpl.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tpl.name.toLowerCase().includes(q) ||
        tpl.desc.toLowerCase().includes(q) ||
        tpl.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Privacy & Guardrail Callout */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-emerald-200 shadow-2xs">
        <div className="size-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
          <ShieldCheck className="size-4.5" />
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-emerald-300">
              Zero-Leak Credential Shield Active
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium">
              SSRF Protected
            </span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-emerald-200/80">
            Authorization tokens are stored securely and injected by Botato&apos;s server-side proxy. {botName || "Your bot"} executes tools dynamically without ever seeing or logging raw API keys.
          </p>
        </div>
      </div>

      {/* Preset App Directory / Showcase */}
      {!isAdding && (
        <div className="space-y-3 rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xs">
          {/* Showcase Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground text-sm tracking-tight">
                Model Context Protocol Showcase
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect external apps and live services so {botName || "your bot"} can read, search, and automate actions.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Select
                onValueChange={(val) => {
                  if (typeof val === "string") {
                    const tpl = MCP_TEMPLATES.find((t) => t.name === val);
                    if (tpl) handleApplyTemplate(tpl);
                  }
                }}
              >
                <SelectTrigger className="h-8 w-[160px] text-xs font-medium border-border/80 bg-background/80">
                  <SelectValue placeholder="Quick Connect..." />
                </SelectTrigger>
                <SelectContent align="end" alignItemWithTrigger={false} className="w-[230px]">
                  <SelectGroup>
                    <SelectLabel>Dev Tools</SelectLabel>
                    {MCP_TEMPLATES.filter((t) => t.category === "developer").map((tpl) => (
                      <SelectItem key={tpl.name} value={tpl.name} className="text-xs">
                        {tpl.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Productivity</SelectLabel>
                    {MCP_TEMPLATES.filter((t) => t.category === "productivity").map((tpl) => (
                      <SelectItem key={tpl.name} value={tpl.name} className="text-xs">
                        {tpl.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Search &amp; Web</SelectLabel>
                    {MCP_TEMPLATES.filter((t) => t.category === "search").map((tpl) => (
                      <SelectItem key={tpl.name} value={tpl.name} className="text-xs">
                        {tpl.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium shrink-0 border-border/80 hover:border-primary/50"
                onClick={() => {
                  setName("");
                  setUrl("");
                  setAuthHeader("");
                  setActiveGuide(null);
                  setActiveTemplate(null);
                  setIsAdding(true);
                }}
              >
                <Plus className="size-3.5" />
                <span>Custom Server</span>
              </Button>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-border/60">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search tools, databases, apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs rounded-lg border-border/70 bg-background/80 placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
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
              <SelectTrigger className="h-8 w-full sm:w-[150px] shrink-0 text-xs bg-background/80 border-border/70">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false} className="text-xs">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="developer">Dev Tools</SelectItem>
                <SelectItem value="productivity">Productivity</SelectItem>
                <SelectItem value="search">Search &amp; Web</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Showcase Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 max-h-[300px] overflow-y-auto pr-1">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground space-y-1">
                <p className="text-xs">No MCP services found matching &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <div
                    key={tpl.name}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="group relative flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-background/80 hover:bg-muted/40 hover:border-primary/50 transition-all duration-200 cursor-pointer text-left shadow-2xs hover:shadow-md"
                  >
                    {/* Brand / App Icon */}
                    <div
                      className={`size-10 rounded-xl ${tpl.accentBg} ${tpl.accentBorder} border flex items-center justify-center ${tpl.accentText} shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs`}
                    >
                      <Icon className="size-5" />
                    </div>

                    {/* App Content */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                            {tpl.name}
                          </span>
                        </div>
                        {tpl.isFree ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 font-mono font-medium border border-emerald-500/25 shrink-0">
                            Free
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono shrink-0">
                            API Key
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {tpl.desc}
                      </p>

                      <div className="pt-1 flex items-center justify-between text-[10.5px]">
                        <span className="text-muted-foreground/75 font-mono">
                          {tpl.categoryLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-primary group-hover:translate-x-0.5 transition-transform">
                          <span>Connect</span>
                          <ArrowRight className="size-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add New Server / Template Configuration Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              {activeTemplate ? (
                <div
                  className={`size-9 rounded-xl ${activeTemplate.accentBg} ${activeTemplate.accentBorder} border flex items-center justify-center ${activeTemplate.accentText}`}
                >
                  <activeTemplate.icon className="size-4.5" />
                </div>
              ) : (
                <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Server className="size-4.5" />
                </div>
              )}
              <div>
                <h4 className="font-semibold text-foreground text-sm">
                  {activeTemplate ? `Connect ${activeTemplate.name}` : "Connect Custom MCP Server"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Credentials are proxy-routed and shielded with zero token leakage.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsAdding(false);
                setActiveTemplate(null);
              }}
            >
              Cancel
            </Button>
          </div>

          {/* Quick Guide Banner for Selected Template */}
          {activeGuide && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary">
              <HelpCircle className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <span className="font-semibold">Setup Guidance:</span>{" "}
                <span>{activeGuide}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Field className="sm:col-span-1">
              <FieldLabel htmlFor="mcp-name">App / Display Name</FieldLabel>
              <Input
                id="mcp-name"
                placeholder="e.g. Google Drive MCP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </Field>

            <Field className="sm:col-span-1">
              <FieldLabel htmlFor="mcp-url">MCP Server Endpoint URL</FieldLabel>
              <Input
                id="mcp-url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="h-9 text-xs font-mono"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="mcp-auth">
              {activeTemplate?.headerKey ? (
                <span>
                  API Key or Access Token ({activeTemplate.headerKey})
                </span>
              ) : (
                <span>API Key or Bearer Token (Optional)</span>
              )}
            </FieldLabel>
            <Input
              id="mcp-auth"
              type="password"
              placeholder={activeTemplate?.headerPlaceholder || "Enter API key or access token..."}
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
              className="h-9 text-xs font-mono"
            />
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <Lock className="size-3 text-emerald-400 shrink-0" />
              <span>
                Encrypted &amp; Masked: Tokens are never exposed in prompt transcripts, logs, or client-side bundles.
              </span>
            </div>
          </Field>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setActiveTemplate(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name || !url}
              className="font-medium gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="size-3.5" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Zap className="size-3.5" />
                  <span>Save &amp; Connect App</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* List of Active Connected Servers */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-foreground">
              Active Connected Apps
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted font-mono font-medium text-muted-foreground">
              {servers.length}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground gap-2 rounded-xl border border-border bg-card/40">
            <Spinner className="size-4" />
            <span className="text-xs">Loading connected tools...</span>
          </div>
        ) : servers.length === 0 && !isAdding ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-card/30 p-6 text-center text-muted-foreground space-y-2">
            <div className="size-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <Server className="size-5" />
            </div>
            <div className="font-medium text-foreground text-xs">No external apps connected yet</div>
            <p className="text-[11.5px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Choose an app from the showcase directory above to give {botName || "this bot"} live search, drive access, or team automation.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {servers.map((server) => {
              const test = testResults[server.id];
              const isTesting = testingId === server.id;

              return (
                <div
                  key={server.id}
                  className="rounded-xl border border-border/80 bg-card/70 p-3.5 space-y-2.5 shadow-2xs hover:border-border transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <span
                          className={`size-2.5 rounded-full block ${server.isEnabled ? "bg-emerald-500 shadow-xs shadow-emerald-500/50" : "bg-muted-foreground"
                            }`}
                        />
                        {server.isEnabled && (
                          <span className="size-2.5 rounded-full bg-emerald-500 animate-ping absolute inset-0 opacity-75" />
                        )}
                      </div>

                      <span className="font-semibold text-xs text-foreground truncate">
                        {server.name}
                      </span>

                      {server.botId ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono font-medium">
                          Scoped to bot
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium border border-primary/20">
                          Account-wide
                        </span>
                      )}
                    </div>

                    {/* Server Actions */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => handleTest(server.id)}
                        disabled={isTesting}
                        title="Test server handshake and query tools"
                      >
                        <RefreshCw className={`size-3 ${isTesting ? "animate-spin text-primary" : ""}`} />
                        <span>Test Handshake</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`h-7 text-xs px-2.5 font-medium ${server.isEnabled
                            ? "text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                            : "text-muted-foreground hover:text-foreground bg-muted"
                          }`}
                        onClick={() => handleToggle(server.id, server.isEnabled)}
                      >
                        {server.isEnabled ? "Active" : "Paused"}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(server.id)}
                        title="Remove server"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* URL Row */}
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/50">
                    <span className="truncate">{server.url}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(server.id, server.url)}
                      className="p-1 hover:text-foreground text-muted-foreground transition-colors cursor-pointer shrink-0"
                      title="Copy endpoint URL"
                    >
                      {copiedUrlId === server.id ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>

                  {/* Test Result Message */}
                  {test && (
                    <div
                      className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border ${test.success
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        }`}
                    >
                      {test.success ? (
                        <CheckCircle2 className="size-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="size-3.5 shrink-0" />
                      )}
                      <span>{test.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
