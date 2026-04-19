import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const whoamiCommand: CommandDefinition = {
  name: 'whoami',
  group: 'profile',
  subcommand: 'whoami',
  description: 'Show the user the API key belongs to',
  examples: ['carly profile whoami', 'carly profile whoami --pretty'],
  inputSchema: z.object({}),
  cliMappings: {},
  endpoint: { method: 'GET', path: '/whoami' },
  fieldMappings: {},
  handler: (input, client) => executeCommand(whoamiCommand, input, client),
};

export const profileCommands: CommandDefinition[] = [whoamiCommand];
