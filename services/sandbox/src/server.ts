import express, { type Request, type Response, type NextFunction } from "express";
import { SandboxManager } from "./manager.js";
import { CreateSandboxSchema, ExecuteCommandSchema, WriteFileSchema } from "./types.js";
import { execSync } from "node:child_process";

const app = express();
app.use(express.json({ limit: "25mb" }));

const manager = new SandboxManager();
const EXPECTED_API_KEY = process.env.SANDBOX_API_KEY || "dev-sandbox-key";
const PORT = Number(process.env.PORT) || 4000;

// Security Middleware: Bearer token authentication
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Allow health check without auth
  if (req.path === "/health") {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing Bearer token in Authorization header" });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (token !== EXPECTED_API_KEY) {
    res.status(403).json({ error: "Forbidden: Invalid sandbox API key" });
    return;
  }

  next();
}

app.use(authMiddleware);

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  const checkTool = (cmd: string): boolean => {
    try {
      execSync(`which ${cmd}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  };

  res.json({
    status: "ok",
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsage: process.memoryUsage(),
    tools: {
      bash: checkTool("bash"),
      node: checkTool("node"),
      python3: checkTool("python3"),
      pip: checkTool("pip") || checkTool("pip3"),
      git: checkTool("git"),
      curl: checkTool("curl"),
    },
    timestamp: new Date().toISOString(),
  });
});

// Create sandbox
app.post("/sandboxes", async (req: Request, res: Response) => {
  try {
    const parsed = CreateSandboxSchema.parse(req.body);
    const info = await manager.createSandbox(parsed);
    res.status(201).json(info);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create sandbox";
    res.status(400).json({ error: message });
  }
});

// Get sandbox info
app.get("/sandboxes/:id", (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const info = manager.getSandbox(id);
    res.json(info);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sandbox not found";
    res.status(404).json({ error: message });
  }
});

// Terminate sandbox
app.delete("/sandboxes/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const result = await manager.terminateSandbox(id);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to terminate sandbox";
    res.status(500).json({ error: message });
  }
});

// Execute command
app.post("/sandboxes/:id/commands", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = ExecuteCommandSchema.parse(req.body);
    const result = await manager.executeCommand(id, parsed);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute command";
    res.status(400).json({ error: message });
  }
});

// Write file
app.post("/sandboxes/:id/files", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = WriteFileSchema.parse(req.body);
    const result = await manager.writeFile(id, parsed);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to write file";
    res.status(400).json({ error: message });
  }
});

// Read file
app.get("/sandboxes/:id/files", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: "Query parameter 'path' is required" });
      return;
    }
    const result = await manager.readFile(id, filePath);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to read file";
    res.status(400).json({ error: message });
  }
});

// List files
app.get("/sandboxes/:id/files/list", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const targetPath = (req.query.path as string) || ".";
    const files = await manager.listFiles(id, targetPath);
    res.json({ files });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to list files";
    res.status(400).json({ error: message });
  }
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Botato Sandbox Service] Listening on port ${PORT} (0.0.0.0)`);
});

// Graceful shutdown
const shutdown = () => {
  console.log("[Botato Sandbox Service] Shutting down gracefully...");
  server.close(() => {
    console.log("[Botato Sandbox Service] HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
