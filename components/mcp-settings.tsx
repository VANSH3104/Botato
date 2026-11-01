"use client";

import * as React from "react";
import {
  ShieldCheck,
  Plus,
  Trash2,
  RefreshCw,
  Server,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
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

const MCP_TEMPLATES = [
  {
    name: "GitHub MCP",
    url: "https://api.github.com/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer ghp_...",
    desc: "Create issues, review pull requests, and search repositories.",
  },
  {
    name: "Notion MCP",
    url: "https://api.notion.com/v1/mcp",
    headerKey: "Authorization",
    headerPlaceholder: "Bearer secret_...",
    desc: "Read/write workspace documents and sync databases.",
  },
  {
    name: "Postgres MCP",
    url: "https://mcp-postgres.internal.cloud/rpc",
    headerKey: "X-Api-Key",
    headerPlaceholder: "pg_secret_...",
    desc: "Query relational database tables with schema introspection.",
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

  // New server form
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [authHeader, setAuthHeader] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [testResults, setTestResults] = React.useState<Record<string, { success: boolean; message: string }>>({});

  const loadServers = React.useCallback(async () => {
    setIsLoading(true);
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
    loadServers();
  }, [loadServers]);

  const handleApplyTemplate = (tpl: (typeof MCP_TEMPLATES)[number]) => {
    setName(tpl.name);
    setUrl(tpl.url);
    setIsAdding(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = {};
      if (authHeader.trim()) {
        headers["Authorization"] = authHeader.trim().startsWith("Bearer ")
          ? authHeader.trim()
          : `Bearer ${authHeader.trim()}`;
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
          title: "MCP Server Connected",
          description: `"${name}" connected with active privacy guards.`,
        });
        setName("");
        setUrl("");
        setAuthHeader("");
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

  return (
    <div className="space-y-4 text-xs">
      {/* Privacy & Guardrail Callout */}
      <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">
        <ShieldCheck className="size-4 shrink-0 text-emerald-400 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-emerald-300">Super Privacy & SSRF Protection Active</div>
          <p className="text-[11px] leading-relaxed text-emerald-200/80">
            Authorization tokens are strictly masked and never stored in chat logs. The bot never receives raw credentials. Internal subnets (loopback, RFC1918, cloud metadata) are blocked.
          </p>
        </div>
      </div>

      {/* Templates Row */}
      {!isAdding && (
        <div className="space-y-1.5">
          <span className="text-[11px] text-muted-foreground font-medium">Quick App Presets:</span>
          <div className="flex flex-wrap gap-2">
            {MCP_TEMPLATES.map((tpl) => (
              <Button
                key={tpl.name}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs font-normal gap-1"
                onClick={() => handleApplyTemplate(tpl)}
              >
                <Plus className="size-3" />
                {tpl.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* List of Connected Servers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">
            Connected MCP Servers ({servers.length})
          </span>
          {!isAdding && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="size-3.5" />
              Add Server
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-6 text-muted-foreground gap-2">
            <Spinner className="size-4" />
            <span>Loading connected tools...</span>
          </div>
        ) : servers.length === 0 && !isAdding ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground space-y-1.5">
            <Server className="size-8 mx-auto text-muted-foreground/60" />
            <div className="font-medium text-foreground text-xs">No external apps connected yet</div>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Connect GitHub, Notion, or custom MCP servers to give {botName || "this bot"} specialized external tools.
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
                  className="rounded-lg border border-border bg-card/60 p-3 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`size-2 rounded-full shrink-0 ${
                          server.isEnabled ? "bg-emerald-500" : "bg-muted-foreground"
                        }`}
                      />
                      <span className="font-semibold text-xs text-foreground truncate">
                        {server.name}
                      </span>
                      {server.botId ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
                          Scoped to bot
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono">
                          Account-wide
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleTest(server.id)}
                        disabled={isTesting}
                        title="Test server handshake and query tools"
                      >
                        <RefreshCw className={`size-3 ${isTesting ? "animate-spin" : ""}`} />
                        <span>Test</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`h-7 text-xs px-2 ${
                          server.isEnabled ? "text-emerald-500 hover:text-emerald-400" : "text-muted-foreground"
                        }`}
                        onClick={() => handleToggle(server.id, server.isEnabled)}
                      >
                        {server.isEnabled ? "Enabled" : "Paused"}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(server.id)}
                        title="Remove server"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="font-mono text-[11px] text-muted-foreground truncate bg-muted/40 px-2 py-1 rounded border border-border/50">
                    {server.url}
                  </div>

                  {test && (
                    <div
                      className={`flex items-center gap-1.5 text-[11px] pt-1 ${
                        test.success ? "text-emerald-400" : "text-rose-400"
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

      {/* Add New Server Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground text-xs">Connect New MCP Server</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
          </div>

          <Field>
            <FieldLabel htmlFor="mcp-name">App / Server Name</FieldLabel>
            <Input
              id="mcp-name"
              placeholder="e.g. GitHub MCP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="mcp-url">Server Endpoint URL</FieldLabel>
            <Input
              id="mcp-url"
              type="url"
              placeholder="https://api.github.com/mcp"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="mcp-auth">
              Bearer Token / API Key (Optional)
            </FieldLabel>
            <Input
              id="mcp-auth"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
            />
            <span className="text-[10px] text-muted-foreground">
              🔒 Encrypted & Masked: Tokens are never exposed in prompt transcripts, logs, or client-side bundles.
            </span>
          </Field>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !name || !url}>
              {isSubmitting ? (
                <>
                  <Spinner className="size-3.5 mr-1" />
                  Verifying...
                </>
              ) : (
                "Save & Connect"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
