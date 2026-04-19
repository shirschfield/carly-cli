import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { resolveAuth } from '../core/auth.js';
import { CarlyClient } from '../core/client.js';
import { allCommands } from '../commands/index.js';

export async function startMcpServer(): Promise<void> {
  const { apiKey, baseUrl } = await resolveAuth();
  const client = new CarlyClient({ apiKey, baseUrl });

  const server = new McpServer({
    name: 'carly',
    version: '0.1.0',
  });

  for (const cmdDef of allCommands) {
    server.registerTool(
      cmdDef.name,
      {
        description: cmdDef.description,
        inputSchema: cmdDef.inputSchema.shape,
      },
      async (args: Record<string, unknown>) => {
        try {
          const result = await cmdDef.handler(args as any, client);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  error: error?.message ?? String(error),
                  code: error?.code ?? 'UNKNOWN_ERROR',
                }),
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(
    `Carly MCP server started. ${allCommands.length} tool(s) registered:\n` +
      allCommands.map((c) => `  - ${c.name}`).join('\n'),
  );
}
