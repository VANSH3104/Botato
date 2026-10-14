import { tool } from "ai";
import { z } from "zod";
import { defaultSandboxClient, SandboxClient } from "./client";

export function createSandboxTools(client: SandboxClient = defaultSandboxClient) {
  return {
    createSandbox: tool({
      description:
        "Create an isolated execution sandbox environment for running code, installing dependencies, or manipulating files.",
      inputSchema: z.object({
        timeoutSeconds: z
          .number()
          .int()
          .min(10)
          .max(3600)
          .optional()
          .describe("Lifetime of the sandbox in seconds before auto-termination (default: 600s)."),
        persistent: z
          .boolean()
          .optional()
          .describe("If true, the workspace files are retained across task sessions."),
      }),
      execute: async ({ timeoutSeconds, persistent }: { timeoutSeconds?: number; persistent?: boolean }) => {
        try {
          const sandbox = await client.createSandbox({ timeoutSeconds, persistent });
          return {
            success: true,
            sandboxId: sandbox.id,
            status: sandbox.status,
            createdAt: sandbox.createdAt,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create sandbox",
          };
        }
      },
    }),

    executeCommand: tool({
      description:
        "Execute a shell command inside an isolated sandbox (e.g. run python, node, bash scripts, pip install, npm install, git).",
      inputSchema: z.object({
        sandboxId: z.string().describe("The ID of the target sandbox."),
        command: z.string().describe("The shell command to execute inside the sandbox."),
        cwd: z
          .string()
          .optional()
          .describe("Optional working directory relative to the sandbox workspace root."),
        timeoutSeconds: z
          .number()
          .int()
          .min(1)
          .max(600)
          .optional()
          .describe("Maximum execution duration in seconds before killing the process (default: 60s)."),
      }),
      execute: async ({
        sandboxId,
        command,
        cwd,
        timeoutSeconds,
      }: {
        sandboxId: string;
        command: string;
        cwd?: string;
        timeoutSeconds?: number;
      }) => {
        try {
          const result = await client.executeCommand(sandboxId, {
            command,
            cwd,
            timeoutSeconds,
          });
          const maxOutput = 1500;
          let stdout = result.stdout || "";
          if (stdout.length > maxOutput) {
            stdout = stdout.slice(0, maxOutput) + `\n... [output truncated, ${stdout.length - maxOutput} chars omitted]`;
          }
          let stderr = result.stderr || "";
          if (stderr.length > maxOutput) {
            stderr = stderr.slice(0, maxOutput) + `\n... [error output truncated]`;
          }

          return {
            success: result.exitCode === 0,
            commandId: result.commandId,
            stdout,
            stderr,
            exitCode: result.exitCode,
            durationMs: result.durationMs,
            timedOut: result.timedOut,
            status: result.status,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Command execution failed",
          };
        }
      },
    }),

    writeFile: tool({
      description:
        "Write content to a file inside the sandbox workspace. Automatically creates parent directories.",
      inputSchema: z.object({
        sandboxId: z.string().describe("The ID of the target sandbox."),
        path: z.string().describe("Relative path to the file inside the sandbox workspace."),
        content: z.string().describe("The text content to write to the file."),
      }),
      execute: async ({
        sandboxId,
        path: filePath,
        content,
      }: {
        sandboxId: string;
        path: string;
        content: string;
      }) => {
        try {
          const result = await client.writeFile(sandboxId, filePath, content);
          return {
            success: true,
            path: result.path,
            bytesWritten: result.bytesWritten,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to write file",
          };
        }
      },
    }),

    readFile: tool({
      description:
        "Read content from a file inside the sandbox workspace.",
      inputSchema: z.object({
        sandboxId: z.string().describe("The ID of the target sandbox."),
        path: z.string().describe("Relative path to the file inside the sandbox workspace."),
      }),
      execute: async ({
        sandboxId,
        path: filePath,
      }: {
        sandboxId: string;
        path: string;
      }) => {
        try {
          const result = await client.readFile(sandboxId, filePath);
          return {
            success: true,
            path: filePath,
            content: result.content,
            sizeBytes: result.sizeBytes,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to read file",
          };
        }
      },
    }),

    listFiles: tool({
      description:
        "List files and directories in a directory within the sandbox workspace.",
      inputSchema: z.object({
        sandboxId: z.string().describe("The ID of the target sandbox."),
        path: z
          .string()
          .optional()
          .describe("Relative path of the directory to inspect (default: '.' for root)."),
      }),
      execute: async ({
        sandboxId,
        path: dirPath = ".",
      }: {
        sandboxId: string;
        path?: string;
      }) => {
        try {
          const files = await client.listFiles(sandboxId, dirPath);
          return {
            success: true,
            path: dirPath,
            files,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to list files",
          };
        }
      },
    }),

    browseWeb: tool({
      description:
        "Browse a public website or search query to gather research and documentation. Displays the webpage in the internal browser.",
      inputSchema: z.object({
        url: z
          .string()
          .describe("URL to navigate to (e.g. 'https://owasp.org') or search query (e.g. 'cyber security guide')."),
        sandboxId: z.string().optional().describe("Optional active sandbox ID."),
      }),
      execute: async ({ url, sandboxId: _sandboxId }: { url: string; sandboxId?: string }) => {
        try {
          let targetUrl = url.trim();
          if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            if (targetUrl.includes(".") && !targetUrl.includes(" ")) {
              targetUrl = `https://${targetUrl}`;
            } else if (targetUrl.toLowerCase().includes("youtube")) {
              targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(targetUrl.replace(/youtube/gi, "").trim())}`;
            } else {
              targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(targetUrl)}`;
            }
          }

          const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
          let pageText = "";

          // Fetch page with standard browser headers to prevent bot challenges
          const res = await fetch(targetUrl, {
            headers: {
              "User-Agent": BROWSER_UA,
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
            },
          });

          const html = await res.text();

          // If searching YouTube, extract video IDs and titles directly from response data
          if (targetUrl.includes("youtube.com")) {
            const rawIds = [
              ...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g),
              ...html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g),
            ].map((m) => m[1]);
            const unique = [...new Set(rawIds)].filter((id) => id.length === 11).slice(0, 5);
            if (unique.length > 0) {
              pageText = "Top YouTube videos found:\n" + unique.map((id, i) => `${i + 1}. https://www.youtube.com/watch?v=${id}`).join("\n");
            }
          }

          if (!pageText) {
            pageText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
              .replace(/<[^>]*>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 2000);
          }

          return {
            success: true,
            url: targetUrl,
            summary: pageText.slice(0, 1500),
          };
        } catch (error) {
          return {
            success: false,
            url,
            error: error instanceof Error ? error.message : "Failed to browse web",
          };
        }
      },
    }),

    terminateSandbox: tool({
      description:
        "Terminate an isolated sandbox and clean up its processes and workspace directory.",
      inputSchema: z.object({
        sandboxId: z.string().describe("The ID of the sandbox to terminate."),
      }),
      execute: async ({ sandboxId }: { sandboxId: string }) => {
        try {
          const result = await client.terminateSandbox(sandboxId);
          return {
            success: true,
            sandboxId: result.id,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to terminate sandbox",
          };
        }
      },
    }),
  };
}

export const sandboxTools = createSandboxTools();
