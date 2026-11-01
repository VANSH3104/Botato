import type {
  CommandResult,
  CreateSandboxOptions,
  ExecuteCommandOptions,
  FileEntry,
  ReadFileResult,
  SandboxHealth,
  SandboxInfo,
  WriteFileResult,
} from "./types";

export class SandboxClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(options?: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = (
      options?.baseUrl ||
      process.env.SANDBOX_URL ||
      "http://127.0.0.1:4000"
    ).replace(/\/+$/, "");

    this.apiKey =
      options?.apiKey ||
      process.env.SANDBOX_API_KEY ||
      "dev-sandbox-key";
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      params?: Record<string, string>;
      timeoutMs?: number;
    } = {}
  ): Promise<T> {
    const { method = "GET", body, params, timeoutMs = 65000 } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
      };

      if (body) {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        let errorMessage = `Sandbox request failed: HTTP ${res.status} ${res.statusText}`;
        try {
          const errorJson = (await res.json()) as { error?: string };
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          // ignore non-json error responses
        }
        throw new Error(errorMessage);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  public async checkHealth(): Promise<SandboxHealth> {
    return this.request<SandboxHealth>("/health", { timeoutMs: 2500 });
  }

  public async createSandbox(options?: CreateSandboxOptions): Promise<SandboxInfo> {
    return this.request<SandboxInfo>("/sandboxes", {
      method: "POST",
      body: options || {},
    });
  }

  public async getSandbox(id: string): Promise<SandboxInfo> {
    return this.request<SandboxInfo>(`/sandboxes/${encodeURIComponent(id)}`);
  }

  public async terminateSandbox(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(
      `/sandboxes/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  }

  public async executeCommand(
    sandboxId: string,
    options: ExecuteCommandOptions
  ): Promise<CommandResult> {
    const timeoutMs = ((options.timeoutSeconds || 60) + 10) * 1000;
    return this.request<CommandResult>(
      `/sandboxes/${encodeURIComponent(sandboxId)}/commands`,
      {
        method: "POST",
        body: options,
        timeoutMs,
      }
    );
  }

  public async writeFile(
    sandboxId: string,
    filePath: string,
    content: string,
    encoding: "utf-8" | "base64" = "utf-8"
  ): Promise<WriteFileResult> {
    return this.request<WriteFileResult>(
      `/sandboxes/${encodeURIComponent(sandboxId)}/files`,
      {
        method: "POST",
        body: { path: filePath, content, encoding },
      }
    );
  }

  public async readFile(
    sandboxId: string,
    filePath: string
  ): Promise<ReadFileResult> {
    return this.request<ReadFileResult>(
      `/sandboxes/${encodeURIComponent(sandboxId)}/files`,
      {
        params: { path: filePath },
      }
    );
  }

  public async listFiles(
    sandboxId: string,
    dirPath: string = "."
  ): Promise<FileEntry[]> {
    const res = await this.request<{ files: FileEntry[] }>(
      `/sandboxes/${encodeURIComponent(sandboxId)}/files/list`,
      {
        params: { path: dirPath },
      }
    );
    return res.files;
  }
}

export const defaultSandboxClient = new SandboxClient();
