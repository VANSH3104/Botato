import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { defaultSandboxClient } from "@/lib/sandbox/client";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "health";
  const sandboxId = searchParams.get("sandboxId");

  try {
    if (action === "health") {
      const health = await defaultSandboxClient.checkHealth();
      return NextResponse.json(health);
    }

    if (!sandboxId) {
      return NextResponse.json({ error: "sandboxId is required" }, { status: 400 });
    }

    if (action === "info") {
      const info = await defaultSandboxClient.getSandbox(sandboxId);
      return NextResponse.json(info);
    }

    if (action === "files") {
      const dirPath = searchParams.get("path") || ".";
      const files = await defaultSandboxClient.listFiles(sandboxId, dirPath);
      return NextResponse.json({ files });
    }

    if (action === "file") {
      const filePath = searchParams.get("path");
      if (!filePath) {
        return NextResponse.json({ error: "path is required" }, { status: 400 });
      }
      const fileData = await defaultSandboxClient.readFile(sandboxId, filePath);
      return NextResponse.json(fileData);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sandbox API request failed";
    return NextResponse.json({ error: message, online: false }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = body.action || "create";

    if (action === "create") {
      const sandbox = await defaultSandboxClient.createSandbox({
        timeoutSeconds: body.timeoutSeconds || 600,
        persistent: body.persistent || false,
      });
      return NextResponse.json(sandbox);
    }

    if (action === "execute") {
      const { sandboxId, command, cwd, timeoutSeconds } = body;
      if (!sandboxId || !command) {
        return NextResponse.json(
          { error: "sandboxId and command are required" },
          { status: 400 }
        );
      }
      const result = await defaultSandboxClient.executeCommand(sandboxId, {
        command,
        cwd,
        timeoutSeconds,
      });
      return NextResponse.json(result);
    }

    if (action === "write") {
      const { sandboxId, path: filePath, content } = body;
      if (!sandboxId || !filePath || content === undefined) {
        return NextResponse.json(
          { error: "sandboxId, path, and content are required" },
          { status: 400 }
        );
      }
      const result = await defaultSandboxClient.writeFile(sandboxId, filePath, content);
      return NextResponse.json(result);
    }

    if (action === "terminate") {
      const { sandboxId } = body;
      if (!sandboxId) {
        return NextResponse.json({ error: "sandboxId is required" }, { status: 400 });
      }
      const result = await defaultSandboxClient.terminateSandbox(sandboxId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sandbox API request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
