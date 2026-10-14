export interface CreateSandboxOptions {
  id?: string;
  timeoutSeconds?: number;
  persistent?: boolean;
  metadata?: Record<string, string>;
}

export interface ExecuteCommandOptions {
  command: string;
  cwd?: string;
  timeoutSeconds?: number;
  env?: Record<string, string>;
  background?: boolean;
}

export interface CommandResult {
  commandId: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
  status: "completed" | "failed" | "timed_out" | "running";
}

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  updatedAt: string;
}

export interface SandboxInfo {
  id: string;
  workspacePath: string;
  createdAt: string;
  lastActiveAt: string;
  persistent: boolean;
  status: "ready" | "busy" | "terminated";
  activeProcesses: number;
}

export interface WriteFileResult {
  success: boolean;
  path: string;
  bytesWritten: number;
}

export interface ReadFileResult {
  content: string;
  sizeBytes: number;
}

export interface SandboxHealth {
  status: "ok" | "error";
  uptimeSeconds: number;
  memoryUsage?: Record<string, number>;
  tools: {
    bash: boolean;
    node: boolean;
    python3: boolean;
    pip: boolean;
    git: boolean;
    curl: boolean;
  };
  timestamp: string;
}
