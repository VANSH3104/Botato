import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { resolveSafePath, getSanitizedEnv, isPublicNetworkDestination } from "../services/sandbox/src/security.js";
import { SandboxManager } from "../services/sandbox/src/manager.js";

describe("Sandbox Security & Path Traversal", () => {
  const tmpRoot = path.join(os.tmpdir(), "sandbox-security-test");

  it("should resolve valid paths within workspace", () => {
    const resolved = resolveSafePath(tmpRoot, "src/index.ts");
    assert.equal(resolved, path.join(tmpRoot, "src/index.ts"));
  });

  it("should reject path traversal escapes with ..", () => {
    assert.throws(
      () => resolveSafePath(tmpRoot, "../../../etc/passwd"),
      /Security violation/
    );
  });

  it("should strip sensitive credentials from process environment", () => {
    const dirtyEnv = {
      DATABASE_URL: "postgresql://secret@postgres.com/db",
      CLERK_SECRET_KEY: "sk_live_secret",
      TRIGGER_SECRET_KEY: "tr_secret",
      SAFE_VAR: "my-public-value",
    };

    const sanitized = getSanitizedEnv(dirtyEnv);
    assert.equal(sanitized.DATABASE_URL, undefined);
    assert.equal(sanitized.CLERK_SECRET_KEY, undefined);
    assert.equal(sanitized.TRIGGER_SECRET_KEY, undefined);
    assert.equal(sanitized.SAFE_VAR, "my-public-value");
    assert.equal(sanitized.USER, "sandbox");
  });

  it("should enforce SSRF protection on network destinations", () => {
    // Prohibited internal & metadata endpoints
    assert.equal(isPublicNetworkDestination("localhost"), false);
    assert.equal(isPublicNetworkDestination("127.0.0.1"), false);
    assert.equal(isPublicNetworkDestination("::1"), false);
    assert.equal(isPublicNetworkDestination("169.254.169.254"), false);
    assert.equal(isPublicNetworkDestination("10.0.0.5"), false);
    assert.equal(isPublicNetworkDestination("192.168.1.1"), false);
    assert.equal(isPublicNetworkDestination("172.16.0.1"), false);
    assert.equal(isPublicNetworkDestination("botato.railway.internal"), false);

    // Permitted public destinations
    assert.equal(isPublicNetworkDestination("api.github.com"), true);
    assert.equal(isPublicNetworkDestination("registry.npmjs.org"), true);
    assert.equal(isPublicNetworkDestination("8.8.8.8"), true);
  });
});

describe("SandboxManager Lifecycle and Command Execution", () => {
  const testWorkspacesDir = path.join(os.tmpdir(), "botato-sandbox-tests");
  const manager = new SandboxManager(testWorkspacesDir);
  let sandboxId: string;

  it("should create a sandbox workspace", async () => {
    const sandbox = await manager.createSandbox({
      timeoutSeconds: 300,
      persistent: false,
    });
    assert.ok(sandbox.id);
    assert.equal(sandbox.status, "ready");
    sandboxId = sandbox.id;
  });

  it("should write and read files inside sandbox", async () => {
    const writeResult = await manager.writeFile(sandboxId, {
      path: "hello.txt",
      content: "Hello from Botato Sandbox!",
      encoding: "utf-8",
    });
    assert.equal(writeResult.success, true);
    assert.equal(writeResult.path, "hello.txt");

    const readResult = await manager.readFile(sandboxId, "hello.txt");
    assert.equal(readResult.content, "Hello from Botato Sandbox!");

    const files = await manager.listFiles(sandboxId, ".");
    const found = files.find((f) => f.name === "hello.txt");
    assert.ok(found);
    assert.equal(found?.isDirectory, false);
  });

  it("should execute shell commands and capture output", async () => {
    const cmdResult = await manager.executeCommand(sandboxId, {
      command: "echo 'Testing 1 2 3' && cat hello.txt",
      timeoutSeconds: 10,
    });

    assert.equal(cmdResult.exitCode, 0);
    assert.equal(cmdResult.status, "completed");
    assert.ok(cmdResult.stdout.includes("Testing 1 2 3"));
    assert.ok(cmdResult.stdout.includes("Hello from Botato Sandbox!"));
  });

  it("should enforce command execution timeouts", async () => {
    const cmdResult = await manager.executeCommand(sandboxId, {
      command: "sleep 10",
      timeoutSeconds: 1, // 1 second timeout
    });

    assert.equal(cmdResult.timedOut, true);
    assert.equal(cmdResult.status, "timed_out");
    assert.ok(cmdResult.stderr.includes("timed out"));
  });

  it("should terminate the sandbox and clean up filesystem", async () => {
    const termResult = await manager.terminateSandbox(sandboxId);
    assert.equal(termResult.success, true);
    assert.throws(() => manager.getSandbox(sandboxId), /not found/);
  });
});
