import express, { type Request, type Response } from "express";
import { spawn } from "node:child_process";
import { MCP_SERVICES } from "./registry.js";

const app = express();
app.use(express.json({ limit: "15mb" }));

const PORT = Number(process.env.PORT) || 8000;

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    services: Object.keys(MCP_SERVICES),
    timestamp: new Date().toISOString(),
  });
});

// Root index: lists available services and endpoints
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Botato Unified MCP Gateway",
    description: "Connect open-source stdio MCP servers over standard HTTP JSON-RPC 2.0.",
    availableEndpoints: Object.entries(MCP_SERVICES).map(([id, cfg]) => ({
      id,
      name: cfg.name,
      endpoint: `/${id}`,
      description: cfg.description,
      requiredToken: cfg.tokenEnvVar,
    })),
  });
});

// Generic JSON-RPC handler for any registered MCP service
app.post("/:serviceId", async (req: Request, res: Response): Promise<void> => {
  const serviceId = req.params.serviceId.toLowerCase();
  const service = MCP_SERVICES[serviceId];
  const bodyObj = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;
  const requestId = (bodyObj.id as string | number) ?? null;

  if (!service) {
    res.status(404).json({
      jsonrpc: "2.0",
      id: requestId,
      error: {
        code: -32601,
        message: `Unknown MCP service: "${serviceId}". Available services: ${Object.keys(MCP_SERVICES).join(", ")}`,
      },
    });
    return;
  }

  const headerVal = req.headers.authorization;
  const rawAuth = (Array.isArray(headerVal) ? headerVal[0] : headerVal) || "";
  const token = rawAuth.replace(/^Bearer\s+/i, "").replace(/^Bot\s+/i, "").trim();

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    [service.tokenEnvVar]: token,
  };

  if (serviceId === "notion") {
    env.NOTION_TOKEN = token;
    env.NOTION_API_KEY = token;
  }

  const payloadStr = JSON.stringify(req.body) + "\n";
  let stdoutData = "";
  let stderrData = "";
  let isResolved = false;

  const child = spawn(service.command, service.args, {
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });

  const timer = setTimeout(() => {
    if (!isResolved) {
      isResolved = true;
      try {
        child.kill();
      } catch {
        // ignore
      }
      res.status(504).json({
        jsonrpc: "2.0",
        id: requestId,
        error: {
          code: -32000,
          message: `MCP execution timed out for service "${serviceId}".`,
        },
      });
    }
  }, 25000);

  child.stdout.on("data", (chunk: Buffer) => {
    stdoutData += chunk.toString("utf8");

    // Look for newline-delimited or bracketed JSON response
    const lines = stdoutData.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed) as { jsonrpc?: string };
          if (parsed.jsonrpc === "2.0") {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timer);
              try {
                child.kill();
              } catch {
                // ignore
              }
              res.json(parsed);
              return;
            }
          }
        } catch {
          // not full json yet, continue accumulating
        }
      }
    }
  });

  child.stderr.on("data", (chunk: Buffer) => {
    stderrData += chunk.toString("utf8");
  });

  child.on("error", (err: Error) => {
    if (!isResolved) {
      isResolved = true;
      clearTimeout(timer);
      res.status(500).json({
        jsonrpc: "2.0",
        id: requestId,
        error: {
          code: -32603,
          message: `Failed to spawn MCP process for "${serviceId}": ${err.message}`,
        },
      });
    }
  });

  child.on("close", (code: number | null) => {
    if (!isResolved) {
      isResolved = true;
      clearTimeout(timer);

      // Attempt to parse any final output in stdout
      try {
        const parsed = JSON.parse(stdoutData.trim()) as { jsonrpc?: string };
        res.json(parsed);
        return;
      } catch {
        res.status(500).json({
          jsonrpc: "2.0",
          id: requestId,
          error: {
            code: -32603,
            message: `MCP process exited with code ${code}. Stderr: ${stderrData.slice(0, 300) || "No error output"}`,
          },
        });
      }
    }
  });

  // Write the JSON-RPC request to stdin of the MCP process
  child.stdin.write(payloadStr);
  child.stdin.end();
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Botato MCP Gateway running on http://0.0.0.0:${PORT}`);
});
