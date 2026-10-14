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
}: {
  isOpen: boolean;
  onClose: () => void;
  initialSandboxId?: string;
  initialTab?: "terminal" | "files" | "browser";
  initialBrowserUrl?: string;
}) {
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

  // Check health and initialize sandbox
  const checkHealthAndInit = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sandbox?action=health");
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        setIsOnline(true);
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
  }, [sandboxId]);

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
    <div className="flex flex-col w-full md:w-[480px] lg:w-[560px] xl:w-[620px] h-full border-l border-border bg-card text-card-foreground shadow-2xl transition-all duration-300 z-20 overflow-hidden">
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
              {isOnline === true ? "Sandbox Online" : isOnline === false ? "Sandbox Offline" : "Connecting..."}
            </span>
          </div>

          {sandboxId && (
            <button
              onClick={handleCopySandboxId}
              title="Click to copy sandbox ID"
              className="flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-background border border-border/70 text-muted-foreground hover:text-foreground transition-colors truncate max-w-[140px]"
            >
              <span className="truncate">{sandboxId}</span>
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handleCreateNewSandbox}
            title="Create fresh sandbox"
            disabled={isLoading}
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={activeTab === "files" ? fetchFiles : checkHealthAndInit}
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
            title="Close desktop view"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-border bg-background px-2 gap-1">
        <button
          onClick={() => setActiveTab("terminal")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "terminal"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Terminal className="size-3.5" />
          Terminal
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "files"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderTree className="size-3.5" />
          Files {files.length > 0 && `(${files.length})`}
        </button>
        <button
          onClick={() => setActiveTab("browser")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "browser"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="size-3.5" />
          Browser
        </button>
      </div>

      {/* Panel Content Body */}
      <div className="flex-1 min-h-0 flex flex-col bg-background overflow-hidden">
        {/* Terminal Tab */}
        {activeTab === "terminal" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-black text-emerald-400 font-mono text-xs">
            {/* Terminal Output Logs */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="text-muted-foreground text-[11px] pb-2 border-b border-emerald-900/30">
                Botato Isolated Execution Sandbox (Debian GNU/Linux, Node 22, Python 3)
                <br />
                Workspace: /workspaces/{sandboxId || "..."}
              </div>

              {commandLogs.length === 0 ? (
                <div className="text-zinc-500 py-6 text-center text-[11px]">
                  No commands run yet. Try running:
                  <div className="flex justify-center gap-2 mt-2">
                    <button
                      onClick={() => setCommandInput("python3 --version")}
                      className="px-2 py-1 rounded bg-zinc-900 text-zinc-300 hover:text-emerald-400 border border-zinc-800"
                    >
                      python3 --version
                    </button>
                    <button
                      onClick={() => setCommandInput("node -v")}
                      className="px-2 py-1 rounded bg-zinc-900 text-zinc-300 hover:text-emerald-400 border border-zinc-800"
                    >
                      node -v
                    </button>
                    <button
                      onClick={() => setCommandInput("ls -la")}
                      className="px-2 py-1 rounded bg-zinc-900 text-zinc-300 hover:text-emerald-400 border border-zinc-800"
                    >
                      ls -la
                    </button>
                  </div>
                </div>
              ) : (
                commandLogs.map((log) => (
                  <div key={log.id} className="space-y-1">
                    <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                      <span className="text-emerald-500 font-bold">$ {log.command}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    {log.stdout && (
                      <pre className="whitespace-pre-wrap break-all text-zinc-200 bg-zinc-950/70 p-2 rounded border border-zinc-900">
                        {log.stdout}
                      </pre>
                    )}
                    {log.stderr && (
                      <pre className="whitespace-pre-wrap break-all text-rose-400 bg-rose-950/20 p-2 rounded border border-rose-900/30">
                        {log.stderr}
                      </pre>
                    )}
                  </div>
                ))
              )}
              <div ref={terminalBottomRef} />
            </div>

            {/* Terminal Command Input Form */}
            <form onSubmit={handleExecute} className="p-2 border-t border-zinc-800 bg-zinc-950 flex gap-2 items-center">
              <span className="text-emerald-500 font-bold pl-1">$</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type command (e.g. python3 -c 'print(42)' or ls)..."
                disabled={!isOnline || isLoading}
                className="flex-1 bg-transparent text-emerald-400 outline-none text-xs placeholder:text-zinc-600 font-mono"
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={!commandInput.trim() || !isOnline || isLoading}
                className="h-7 px-2.5 text-xs border-emerald-900 text-emerald-400 hover:bg-emerald-950 hover:text-emerald-300"
              >
                {isLoading ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
              </Button>
            </form>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === "files" && (
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            {/* File List Column */}
            <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-border overflow-y-auto p-2 space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground px-2 py-1 flex items-center justify-between">
                <span>WORKSPACE FILES</span>
                <button onClick={fetchFiles} className="hover:text-foreground">
                  <RefreshCw className="size-3" />
                </button>
              </div>

              {files.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 text-center">
                  Workspace is empty. Files written by Botato will show here.
                </div>
              ) : (
                files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => !file.isDirectory && handleViewFile(file.path)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${
                      selectedFile?.path === file.path
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {file.isDirectory ? (
                      <FolderTree className="size-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <FileText className="size-3.5 text-blue-500 shrink-0" />
                    )}
                    <span className="truncate flex-1">{file.name}</span>
                    {file.sizeBytes !== undefined && (
                      <span className="text-[10px] text-muted-foreground shrink-0">{file.sizeBytes}B</span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* File Content Preview Column */}
            <div className="flex-1 flex flex-col overflow-hidden bg-muted/20">
              {selectedFile ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background text-xs font-mono">
                    <span className="truncate text-foreground font-medium">{selectedFile.path}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-foreground whitespace-pre">
                    {selectedFile.content}
                  </pre>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-muted-foreground">
                  Select a file from the list to view its code and contents.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Browser Tab */}
        {activeTab === "browser" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
            {/* Real Browser Navigation Bar */}
            <div className="flex items-center gap-1.5 p-2 border-b border-border bg-muted/40">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                onClick={handleBrowserBack}
                disabled={browserHistoryIndex <= 0}
                title="Back"
              >
                <ArrowLeft className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                onClick={handleBrowserForward}
                disabled={browserHistoryIndex >= browserHistory.length - 1}
                title="Forward"
              >
                <ArrowRight className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
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
                className="size-7 text-muted-foreground hover:text-foreground"
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
                className="flex-1 flex items-center gap-1.5 px-2.5 py-1 rounded bg-background border border-border text-xs focus-within:ring-1 focus-within:ring-primary"
              >
                <Lock className="size-3 text-emerald-500 shrink-0" />
                <input
                  type="text"
                  value={browserInput}
                  onChange={(e) => setBrowserInput(e.target.value)}
                  placeholder="Enter URL or search (e.g. cyber security guide)..."
                  className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  className="text-muted-foreground hover:text-foreground"
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
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
        )}
      </div>
    </div>
  );
}
