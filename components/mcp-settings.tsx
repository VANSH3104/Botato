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
  FileText,
  Database,
  Code2,
  Zap,
  Check,
  Copy,
  CreditCard,
  Bug,
  Cloud,
  Search,
  ChevronDown,
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

type McpCategory = "productivity" | "search" | "developer";

export interface McpTemplate {
  name: string;
  category: McpCategory;
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
    categoryLabel: "Developer tools",
    url: "https://mcp.neon.tech/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer neon_...",
    keyGuide: "Get an API key from the Neon Console (console.neon.tech).",
    desc: "Inspect Postgres tables, run queries, and manage database branches.",
    icon: Database,
    accentBg: "bg-cyan-500/10",
    accentText: "text-cyan-500 dark:text-cyan-400",
    accentBorder: "border-cyan-500/30",
  },
  {
    name: "Supabase Database",
    category: "developer",
    categoryLabel: "Developer tools",
    url: "https://mcp.supabase.com/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer sbp_...",
    keyGuide: "Create a Personal Access Token from your Supabase account settings.",
    desc: "Query Postgres, inspect schemas, and work with storage resources.",
    icon: Database,
    accentBg: "bg-emerald-500/10",
    accentText: "text-emerald-500 dark:text-emerald-400",
    accentBorder: "border-emerald-500/30",
  },
  {
    name: "Stripe Billing & Payments",
    category: "developer",
    categoryLabel: "Developer tools",
    url: "https://mcp.stripe.com",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer ...",
    keyGuide: "Use an appropriate restricted or secret key from your Stripe dashboard.",
    desc: "Inspect customers, retrieve invoices, and review subscription information.",
    icon: CreditCard,
    accentBg: "bg-indigo-500/10",
    accentText: "text-indigo-500 dark:text-indigo-400",
    accentBorder: "border-indigo-500/30",
  },
  {
    name: "Sentry Error Tracking",
    category: "developer",
    categoryLabel: "Developer tools",
    url: "https://mcp.sentry.io",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer ...",
    keyGuide: "Create a user auth token in Sentry account settings.",
    desc: "Query production issues, inspect stack traces, and review releases.",
    icon: Bug,
    accentBg: "bg-rose-500/10",
    accentText: "text-rose-500 dark:text-rose-400",
    accentBorder: "border-rose-500/30",
  },
  {
    name: "Linear Tasks",
    category: "developer",
    categoryLabel: "Developer tools",
    url: "https://mcp.linear.app/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer lin_api_...",
    keyGuide: "Create a Personal API key in Linear Settings → Account → API.",
    desc: "Track issues, update projects, and create backlog tasks.",
    icon: CheckCircle2,
    accentBg: "bg-indigo-500/10",
    accentText: "text-indigo-500 dark:text-indigo-400",
    accentBorder: "border-indigo-500/30",
  },
  {
    name: "GitHub Copilot MCP",
    category: "developer",
    categoryLabel: "Developer tools",
    url: "https://api.githubcopilot.com/mcp/",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer ...",
    keyGuide: "Use a GitHub token with only the permissions your integration requires.",
    desc: "Work with repositories, pull requests, diffs, and issues.",
    icon: Code2,
    accentBg: "bg-violet-500/10",
    accentText: "text-violet-500 dark:text-violet-400",
    accentBorder: "border-violet-500/30",
  },
  {
    name: "Cloudflare Infrastructure",
    category: "developer",
    categoryLabel: "Developer tools",
    url: "https://mcp.cloudflare.com/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer ...",
    keyGuide: "Create an API token with only the Cloudflare permissions you need.",
    desc: "Manage Workers, KV namespaces, DNS records, and R2 resources.",
    icon: Cloud,
    accentBg: "bg-orange-500/10",
    accentText: "text-orange-500 dark:text-orange-400",
    accentBorder: "border-orange-500/30",
  },
  {
    name: "Notion Workspace",
    category: "productivity",
    categoryLabel: "Productivity",
    url: "https://mcp.notion.com/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer ...",
    keyGuide: "mcp.notion.com requires an OAuth token. If using an Internal Integration token (ntn_...), provide your self-hosted Notion MCP server URL.",
    desc: "Search pages, read workspace documents, and work with databases.",
    icon: FileText,
    accentBg: "bg-stone-500/10",
    accentText: "text-stone-700 dark:text-stone-300",
    accentBorder: "border-stone-500/30",
  },
  {
    name: "Brave Search",
    category: "search",
    categoryLabel: "Search & web",
    url: "https://api.search.brave.com/res/v1/mcp",
    headerKey: "X-Subscription-Token",
    headerPlaceholder: "BSA...",
    keyGuide: "Get a Brave Search API key from brave.com/search/api.",
    desc: "Search the web for current pages, articles, and information.",
    icon: Search,
    accentBg: "bg-amber-500/10",
    accentText: "text-amber-500 dark:text-amber-400",
    accentBorder: "border-amber-500/30",
  },
];

const CATEGORY_GROUPS: { id: McpCategory; label: string }[] = [
  { id: "developer", label: "Developer tools" },
  { id: "productivity", label: "Productivity" },
  { id: "search", label: "Search & web" },
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

  // Template selection and connection form state.
  const [selectedTemplateName, setSelectedTemplateName] = React.useState("");
  const [activeTemplate, setActiveTemplate] = React.useState<McpTemplate | null>(null);
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [authHeader, setAuthHeader] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Connected server action state.
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [testResults, setTestResults] = React.useState<
    Record<string, { success: boolean; message: string }>
  >({});
  const [copiedUrlId, setCopiedUrlId] = React.useState<string | null>(null);

  const selectedTemplate = React.useMemo(
    () => MCP_TEMPLATES.find((template) => template.name === selectedTemplateName) ?? null,
    [selectedTemplateName]
  );

  const loadServers = React.useCallback(async () => {
    try {
      const result = await listMcpServers(botId);
      if (result.success && result.servers) {
        setServers(result.servers);
      }
    } catch (error) {
      console.error("Failed to load MCP servers:", error);
      toast.add({
        type: "error",
        title: "Could not load MCP servers",
        description: "Please refresh and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [botId]);

  React.useEffect(() => {
    void loadServers();
  }, [loadServers]);

  const resetForm = () => {
    setName("");
    setUrl("");
    setAuthHeader("");
    setActiveTemplate(null);
    setSelectedTemplateName("");
    setIsAdding(false);
  };

  const handleChooseTemplate = (template: McpTemplate) => {
    setSelectedTemplateName(template.name);
    setActiveTemplate(template);
    setName(template.name);
    setUrl(template.url);
    setAuthHeader("");
    setIsAdding(true);
  };

  const handleStartCustomServer = () => {
    setSelectedTemplateName("");
    setActiveTemplate(null);
    setName("");
    setUrl("");
    setAuthHeader("");
    setIsAdding(true);
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName || !trimmedUrl) return;

    try {
      setIsSubmitting(true);

      const headers: Record<string, string> = {};
      const token = authHeader.trim();

      if (token) {
        const headerKey = activeTemplate?.headerKey ?? "Authorization";

        if (headerKey.toLowerCase() === "authorization") {
          headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
        } else {
          headers[headerKey] = token;
        }
      }

      const result = await createMcpServer({
        name: trimmedName,
        url: trimmedUrl,
        botId: botId || null,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        isEnabled: true,
      });

      if (!result.success) {
        toast.add({
          type: "error",
          title: "Connection failed",
          description: result.error || "Could not connect to the MCP server.",
        });
        return;
      }

      toast.add({
        title: "MCP server added",
        description: `${trimmedName} was added successfully.`,
      });

      resetForm();
      await loadServers();
    } catch (error) {
      toast.add({
        type: "error",
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Unexpected error.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);

    try {
      const result = await testMcpServer(id);

      setTestResults((previous) => ({
        ...previous,
        [id]: result.success
          ? {
              success: true,
              message: `Connected — ${result.toolCount ?? 0} tool${result.toolCount === 1 ? "" : "s"} available.`,
            }
          : {
              success: false,
              message: result.error || "The connection test failed.",
            },
      }));
    } catch (error) {
      setTestResults((previous) => ({
        ...previous,
        [id]: {
          success: false,
          message: error instanceof Error ? error.message : "The connection test failed.",
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleToggle = async (server: McpServerItem) => {
    const nextEnabled = !server.isEnabled;

    try {
      await toggleMcpServer(server.id, nextEnabled);
      setServers((previous) =>
        previous.map((item) =>
          item.id === server.id ? { ...item, isEnabled: nextEnabled } : item
        )
      );
    } catch {
      toast.add({
        type: "error",
        title: "Could not update server",
        description: "Please try again.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMcpServer(id);
      setServers((previous) => previous.filter((server) => server.id !== id));
      setTestResults((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
      toast.add({ title: "MCP server removed" });
    } catch {
      toast.add({
        type: "error",
        title: "Could not remove server",
        description: "Please try again.",
      });
    }
  };

  const handleCopyUrl = async (id: string, serverUrl: string) => {
    try {
      await navigator.clipboard.writeText(serverUrl);
      setCopiedUrlId(id);
      window.setTimeout(() => setCopiedUrlId(null), 1800);
    } catch {
      toast.add({
        type: "error",
        title: "Copy failed",
        description: "Your browser did not allow copying this URL.",
      });
    }
  };

  const TemplateIcon = selectedTemplate?.icon;

  return (
    <div className="space-y-5">
      {/* Security information */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-500">
          <ShieldCheck className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Credential protection</p>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              Server-side authentication
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {botName || "Your bot"} connects to external MCP servers through your server-side
            integration. Keep API tokens private and grant only the permissions required.
          </p>
        </div>
      </div>

      {/* MCP directory: one compact dropdown instead of a large card grid */}
      {!isAdding && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h3 className="text-sm font-semibold text-foreground">MCP server directory</h3>
                <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-muted-foreground">
                  Choose an integration from the dropdown. You can review its details before
                  entering credentials and connecting it.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleStartCustomServer}
                className="h-9 shrink-0 gap-2 cursor-pointer"
              >
                <Plus className="size-4" />
                Add custom server
              </Button>
            </div>

            <div className="space-y-2">
              <Field>
                <FieldLabel htmlFor="mcp-template">Choose an MCP integration</FieldLabel>
                <Select
                  value={selectedTemplateName}
                  onValueChange={(value) => {
                    if (typeof value === "string") {
                      setSelectedTemplateName(value);
                    }
                  }}
                >
                  <SelectTrigger id="mcp-template" className="h-11 w-full bg-background">
                    <SelectValue placeholder="Select a server to connect..." />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {CATEGORY_GROUPS.map((category, index) => (
                      <React.Fragment key={category.id}>
                        {index > 0 && <SelectSeparator />}
                        <SelectGroup>
                          <SelectLabel>{category.label}</SelectLabel>
                          {MCP_TEMPLATES.filter(
                            (template) => template.category === category.id
                          ).map((template) => (
                            <SelectItem key={template.name} value={template.name}>
                              <span className="flex items-center gap-2">
                                <template.icon className="size-4 text-muted-foreground" />
                                {template.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {selectedTemplate ? (
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/70 p-3 sm:flex-row sm:items-center">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${selectedTemplate.accentBg} ${selectedTemplate.accentBorder} ${selectedTemplate.accentText}`}
                  >
                    {TemplateIcon && <TemplateIcon className="size-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {selectedTemplate.name}
                      </p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {selectedTemplate.categoryLabel}
                      </span>
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                        {selectedTemplate.headerKey ? "Authentication required" : "No token configured"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {selectedTemplate.desc}
                    </p>
                    <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground/80">
                      {selectedTemplate.url}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    className="shrink-0 gap-2 cursor-pointer"
                    onClick={() => handleChooseTemplate(selectedTemplate)}
                  >
                    <Zap className="size-3.5" />
                    Configure
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-background/50 p-3 text-xs text-muted-foreground">
                  <ChevronDown className="size-4 shrink-0" />
                  Select an integration to see its description and configuration options.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Configuration form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {activeTemplate ? (
                  <activeTemplate.icon className="size-5" />
                ) : (
                  <Server className="size-5" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {activeTemplate ? `Connect ${activeTemplate.name}` : "Add custom MCP server"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Enter the endpoint and authentication details.
                </p>
              </div>
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="cursor-pointer">
              Cancel
            </Button>
          </div>

          {activeTemplate?.keyGuide && (
            <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                <span className="font-semibold text-foreground">Setup guidance: </span>
                {activeTemplate.keyGuide}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="mcp-name">Display name</FieldLabel>
              <Input
                id="mcp-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Google Drive"
                required
                className="h-10"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="mcp-url">MCP server endpoint</FieldLabel>
              <Input
                id="mcp-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/mcp"
                required
                className="h-10 font-mono text-xs"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="mcp-auth">
              {activeTemplate?.headerKey
                ? `API key / access token (${activeTemplate.headerKey})`
                : "API key / bearer token (optional)"}
            </FieldLabel>
            <Input
              id="mcp-auth"
              type="password"
              autoComplete="new-password"
              value={authHeader}
              onChange={(event) => setAuthHeader(event.target.value)}
              placeholder={activeTemplate?.headerPlaceholder ?? "Enter your token"}
              className="h-10 font-mono text-xs"
            />
            <p className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
              <Lock className="size-3 shrink-0 text-emerald-500" />
              Tokens should be stored securely on the server and never exposed to the model.
            </p>
          </Field>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim() || !url.trim()}
              className="gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="size-4" />
                  Connecting...
                </>
              ) : (
                <>
                  <Zap className="size-4" />
                  Save and connect
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Connected servers */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Connected MCP servers</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage the integrations available to {botName || "this bot"}.
            </p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
            {servers.length}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/50 p-8 text-xs text-muted-foreground">
            <Spinner className="size-4" />
            Loading connected servers...
          </div>
        ) : servers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/30 px-5 py-8 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Server className="size-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">No MCP servers connected</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Choose an integration from the directory above or add your own MCP server.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {servers.map((server) => {
              const test = testResults[server.id];
              const isTesting = testingId === server.id;

              return (
                <article
                  key={server.id}
                  className="space-y-3 rounded-xl border border-border bg-card/70 p-3.5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`size-2.5 shrink-0 rounded-full ${
                          server.isEnabled ? "bg-emerald-500" : "bg-muted-foreground"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {server.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {server.botId ? "Scoped to this bot" : "Account-wide"}
                          {server.transport ? ` · ${server.transport}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 px-2 text-xs cursor-pointer"
                        onClick={() => void handleTest(server.id)}
                        disabled={isTesting}
                      >
                        <RefreshCw className={`size-3.5 ${isTesting ? "animate-spin" : ""}`} />
                        Test
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-2.5 text-xs cursor-pointer ${
                          server.isEnabled
                            ? "text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => void handleToggle(server)}
                      >
                        {server.isEnabled ? "Enabled" : "Paused"}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                        onClick={() => void handleDelete(server.id)}
                        aria-label={`Delete ${server.name}`}
                        title="Remove server"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
                      {server.url}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 cursor-pointer"
                      onClick={() => void handleCopyUrl(server.id, server.url)}
                      aria-label="Copy endpoint URL"
                      title="Copy endpoint URL"
                    >
                      {copiedUrlId === server.id ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                  </div>

                  {test && (
                    <div
                      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                        test.success
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                          : "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {test.success ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                      ) : (
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      )}
                      <span>{test.message}</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
