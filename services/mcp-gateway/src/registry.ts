export interface McpServiceConfig {
  name: string;
  command: string;
  args: string[];
  tokenEnvVar: string;
  description: string;
}

export const MCP_SERVICES: Record<string, McpServiceConfig> = {
  notion: {
    name: "Notion",
    command: "npx",
    args: ["@notionhq/notion-mcp-server"],
    tokenEnvVar: "NOTION_TOKEN",
    description: "Official Notion MCP server for pages, databases, and workspace blocks.",
  },
  slack: {
    name: "Slack",
    command: "npx",
    args: ["@modelcontextprotocol/server-slack"],
    tokenEnvVar: "SLACK_BOT_TOKEN",
    description: "Slack MCP server for channels, messages, and threads.",
  },
  "google-calendar": {
    name: "Google Calendar",
    command: "npx",
    args: ["@cocal/google-calendar-mcp"],
    tokenEnvVar: "GOOGLE_API_KEY",
    description: "Google Calendar MCP server for scheduling, events, and meetings.",
  },
  "google-drive": {
    name: "Google Drive",
    command: "npx",
    args: ["@us-all/google-drive-mcp"],
    tokenEnvVar: "GOOGLE_DRIVE_CREDENTIALS",
    description: "Google Drive MCP server for workspace documents and files.",
  },
  github: {
    name: "GitHub",
    command: "npx",
    args: ["@modelcontextprotocol/server-github"],
    tokenEnvVar: "GITHUB_PERSONAL_ACCESS_TOKEN",
    description: "GitHub MCP server for repositories, pull requests, issues, and code search.",
  },
};
