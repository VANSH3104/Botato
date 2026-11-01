"use client";

import * as React from "react";
import {
  Terminal,
  FolderTree,
  Globe,
  RefreshCw,
  Play,
  X,
  FileText,
  Copy,
  Check,
  Plus,
  Loader2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Lock,
  ExternalLink,
  Home,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBotSandbox } from "@/actions/sandbox";

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes?: number;
}

interface CommandLog {
  id: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timestamp: string;
}

export function SandboxDesktop({
  isOpen,
  onClose,
  initialSandboxId,
  initialTab = "terminal",
  initialBrowserUrl,
  botId,
  bots,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialSandboxId?: string;
  initialTab?: "terminal" | "files" | "browser";
  initialBrowserUrl?: string;
  botId?: string;
  bots?: Array<{ id: string; name: string; avatar: string; sandboxId?: string | null }>;
}) {
  const [selectedBotId, setSelectedBotId] = React.useState<string>(() => {
    return botId || bots?.[0]?.id || "";
  });

  React.useEffect(() => {
    if (botId) {
      setSelectedBotId(botId);
    } else if (bots && bots.length > 0 && !selectedBotId) {
      setSelectedBotId(bots[0].id);
    }
  }, [botId, bots]);

  const [activeTab, setActiveTab] = React.useState<"terminal" | "files" | "browser">(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  React.useEffect(() => {
    if (initialBrowserUrl && initialBrowserUrl !== browserCurrentUrl) {
      setBrowserCurrentUrl(initialBrowserUrl);
      setBrowserInput(initialBrowserUrl);
      setBrowserIsLoading(true);
      setBrowserKey((k) => k + 1);
    }
  }, [initialBrowserUrl]);
  const [sandboxId, setSandboxId] = React.useState<string>(initialSandboxId || "");
  const [isOnline, setIsOnline] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [commandInput, setCommandInput] = React.useState<string>("");
  const [commandLogs, setCommandLogs] = React.useState<CommandLog[]>([]);
  const [files, setFiles] = React.useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<{ path: string; content: string } | null>(null);
  const [browserInput, setBrowserInput] = React.useState<string>(initialBrowserUrl || "");
  const [browserCurrentUrl, setBrowserCurrentUrl] = React.useState<string>(initialBrowserUrl || "");
  const [browserHistory, setBrowserHistory] = React.useState<string[]>(initialBrowserUrl ? [initialBrowserUrl] : []);
  const [browserHistoryIndex, setBrowserHistoryIndex] = React.useState<number>(initialBrowserUrl ? 0 : -1);
  const [browserIsLoading, setBrowserIsLoading] = React.useState<boolean>(false);
  const [browserKey, setBrowserKey] = React.useState<number>(0);
  const [copied, setCopied] = React.useState<boolean>(false);
  const terminalBottomRef = React.useRef<HTMLDivElement>(null);

  const navigateBrowser = (target: string) => {
    let finalUrl = target.trim();
    if (!finalUrl) return;

    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      if (finalUrl.includes(".") && !finalUrl.includes(" ")) {
        finalUrl = `https://${finalUrl}`;
      } else {
        finalUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(finalUrl)}`;
      }
    }

    setBrowserInput(finalUrl);
    setBrowserCurrentUrl(finalUrl);
    setBrowserIsLoading(true);
    setBrowserKey((k) => k + 1);

    setBrowserHistory((prev) => {
      const next = prev.slice(0, browserHistoryIndex + 1);
      return [...next, finalUrl];
    });
    setBrowserHistoryIndex((i) => i + 1);
  };

  const handleBrowserBack = () => {
    if (browserHistoryIndex > 0) {
      const prevUrl = browserHistory[browserHistoryIndex - 1];
      setBrowserHistoryIndex((i) => i - 1);
      setBrowserInput(prevUrl);
      setBrowserCurrentUrl(prevUrl);
      setBrowserIsLoading(true);
      setBrowserKey((k) => k + 1);
    }
  };

  const handleBrowserForward = () => {
    if (browserHistoryIndex < browserHistory.length - 1) {
      const nextUrl = browserHistory[browserHistoryIndex + 1];
      setBrowserHistoryIndex((i) => i + 1);
      setBrowserInput(nextUrl);
      setBrowserCurrentUrl(nextUrl);
      setBrowserIsLoading(true);
      setBrowserKey((k) => k + 1);
    }
  };

  const loadBotSandbox = React.useCallback(async (targetBotId: string) => {
    if (!targetBotId) return null;
    setIsLoading(true);
    try {
      const res = await getBotSandbox(targetBotId);
      if (res.success && res.sandboxId) {
        setSandboxId(res.sandboxId);
        setIsOnline(true);
        return res.sandboxId;
      }
    } catch (e) {
      console.error("Failed to load bot sandbox:", e);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  const handleBotChange = async (newBotId: string) => {
    setSelectedBotId(newBotId);
    setSelectedFile(null);
    setFiles([]);
    setCommandLogs([]);
    await loadBotSandbox(newBotId);
  };

  // Check health and initialize sandbox
  const checkHealthAndInit = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sandbox?action=health");
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        setIsOnline(true);
        if (selectedBotId) {
          const sId = await loadBotSandbox(selectedBotId);
          if (sId) return;
        }
        if (initialSandboxId && !sandboxId) {
          setSandboxId(initialSandboxId);
          return;
        }
        if (!sandboxId) {
          // Auto create a sandbox if none active
          const createRes = await fetch("/api/sandbox", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "create", timeoutSeconds: 600 }),
          });
          const createData = await createRes.json();
          if (createRes.ok && createData.id) {
            setSandboxId(createData.id);
          }
        }
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBotId, initialSandboxId, sandboxId, loadBotSandbox]);

  React.useEffect(() => {
    if (isOpen) {
      checkHealthAndInit();
    }
  }, [isOpen, checkHealthAndInit]);

  // Fetch files when Files tab is open
  const fetchFiles = React.useCallback(async () => {
    if (!sandboxId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sandbox?action=files&sandboxId=${encodeURIComponent(sandboxId)}&path=.`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.files)) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error("Failed to fetch files", err);
    } finally {
      setIsLoading(false);
    }
  }, [sandboxId]);

  React.useEffect(() => {
    if (isOpen && activeTab === "files" && sandboxId) {
      fetchFiles();
    }
  }, [isOpen, activeTab, sandboxId, fetchFiles]);

  React.useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [commandLogs]);

  // Execute terminal command
  const handleExecute = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd || !sandboxId) return;

    setCommandInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          sandboxId,
          command: cmd,
          timeoutSeconds: 30,
        }),
      });

      const data = await res.json();
      const newLog: CommandLog = {
        id: data.commandId || Math.random().toString(),
        command: cmd,
        stdout: data.stdout || "",
        stderr: data.stderr || (data.error ? `Error: ${data.error}` : ""),
        exitCode: data.exitCode ?? (res.ok ? 0 : 1),
        timestamp: new Date().toLocaleTimeString(),
      };

      setCommandLogs((prev) => [...prev, newLog]);
      // If the command modified files, refresh file list if files tab is active
      if (activeTab === "files") {
        fetchFiles();
      }
    } catch (err) {
      setCommandLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          command: cmd,
          stdout: "",
          stderr: err instanceof Error ? err.message : "Failed to execute command",
          exitCode: 1,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // View file content
  const handleViewFile = async (filePath: string) => {
    if (!sandboxId) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/sandbox?action=file&sandboxId=${encodeURIComponent(sandboxId)}&path=${encodeURIComponent(filePath)}`
      );
      const data = await res.json();
      if (res.ok) {
        setSelectedFile({ path: filePath, content: data.content || "" });
      }
    } catch (err) {
      console.error("Failed to read file", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new sandbox
  const handleCreateNewSandbox = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", timeoutSeconds: 600 }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setSandboxId(data.id);
        setCommandLogs([]);
        setFiles([]);
        setSelectedFile(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySandboxId = () => {
    if (sandboxId) {
      navigator.clipboard.writeText(sandboxId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:static md:inset-auto flex flex-col w-full md:w-[480px] lg:w-[560px] xl:w-[620px] h-full md:border-l border-border bg-card text-card-foreground shadow-2xl transition-all duration-300 md:z-20 overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`size-2.5 rounded-full ${
                isOnline === true
                  ? "bg-emerald-500 animate-pulse"
                  : isOnline === false
                  ? "bg-rose-500"
                  : "bg-amber-500 animate-ping"
              }`}
            />
            <span className="text-xs font-semibold tracking-tight">
              {isOnline === true ? "Browser Online" : isOnline === false ? "Browser Offline" : "Connecting..."}
            </span>
          </div>

          {sandboxId && (
            <button
              onClick={handleCopySandboxId}
              title="Click to copy sandbox ID"
              className="hidden sm:flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-background border border-border/70 text-muted-foreground hover:text-foreground transition-colors truncate max-w-[140px]"
            >
              <span className="truncate">{sandboxId}</span>
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            </button>
          )}

          {bots && bots.length > 1 && (
            <div className="flex items-center gap-1.5 bg-background border border-border/70 rounded-md px-2 py-0.5 ml-1">
              <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">Bot:</span>
              <select
                value={selectedBotId}
                onChange={(e) => handleBotChange(e.target.value)}
                className="bg-transparent text-xs text-foreground outline-none cursor-pointer font-medium max-w-[100px] truncate"
              >
                {bots.map((b) => (
                  <option key={b.id} value={b.id} className="bg-popover text-popover-foreground">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={checkHealthAndInit}
            title="Refresh"
            disabled={isLoading}
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            title="Close browser view"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>



      {/* Real Browser Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
            {/* Real Browser Navigation Bar */}
            <div className="flex items-center gap-1 sm:gap-1.5 p-2 border-b border-border bg-muted/40">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground shrink-0"
                onClick={handleBrowserBack}
                disabled={browserHistoryIndex <= 0}
                title="Back"
              >
                <ArrowLeft className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground shrink-0"
                onClick={handleBrowserForward}
                disabled={browserHistoryIndex >= browserHistory.length - 1}
                title="Forward"
              >
                <ArrowRight className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => {
                  setBrowserIsLoading(true);
                  setBrowserKey((k) => k + 1);
                }}
                title="Reload"
              >
                <RefreshCw className={`size-3.5 ${browserIsLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground shrink-0 hidden sm:inline-flex"
                onClick={() => navigateBrowser("https://en.wikipedia.org/wiki/Computer_security")}
                title="Home"
              >
                <Home className="size-3.5" />
              </Button>

              {/* Omnibox / Address Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigateBrowser(browserInput);
                }}
                className="flex-1 min-w-0 flex items-center gap-1.5 px-2.5 py-1 rounded bg-background border border-border text-xs focus-within:ring-1 focus-within:ring-primary"
              >
                <Lock className="size-3 text-emerald-500 shrink-0" />
                <input
                  type="text"
                  value={browserInput}
                  onChange={(e) => setBrowserInput(e.target.value)}
                  placeholder="Enter URL or search..."
                  className="flex-1 min-w-0 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  title="Navigate or Search"
                >
                  <Search className="size-3" />
                </button>
              </form>

              {/* Open in external tab */}
              {browserCurrentUrl && (
                <a
                  href={browserCurrentUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                  title="Open in external browser window"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>

            {/* Loading Bar */}
            {browserIsLoading && (
              <div className="h-0.5 w-full bg-primary/20 overflow-hidden">
                <div className="h-full bg-primary w-1/2 animate-[pulse_1s_ease-in-out_infinite]" />
              </div>
            )}

            {/* Internal Browser Viewport */}
            <div className="flex-1 w-full h-full relative bg-background overflow-hidden">
              {browserCurrentUrl ? (
                <iframe
                  key={browserKey}
                  src={`/api/browser/proxy?url=${encodeURIComponent(browserCurrentUrl)}`}
                  onLoad={() => setBrowserIsLoading(false)}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  title="Botato Internal Browser"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full">
                  <div className="size-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-foreground mb-3">
                    <Globe className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Botato Internal Browser</h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Type a URL or search query in the address bar above to navigate.
                  </p>
                </div>
              )}
            </div>
          </div>
    </div>
  );
}
