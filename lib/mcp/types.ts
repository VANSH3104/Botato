export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema?: {
    type?: string;
    properties?: Record<string, {
      type?: string;
      description?: string;
      enum?: string[];
      default?: unknown;
    }>;
    required?: string[];
    [key: string]: unknown;
  };
}

export interface McpToolsListResult {
  tools: McpToolDefinition[];
  nextCursor?: string;
}

export interface McpToolCallResult {
  content?: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface McpServerConfig {
  id: string;
  userId: string;
  botId?: string | null;
  name: string;
  description?: string | null;
  url: string;
  transport?: string;
  headers?: Record<string, string>;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
