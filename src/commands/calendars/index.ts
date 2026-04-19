import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const calendarsListCommand: CommandDefinition = {
  name: 'calendars_list',
  group: 'calendars',
  subcommand: 'list',
  description: 'List connected calendars for the authenticated user',
  examples: [
    'carly calendars list',
    'carly calendars list --output table',
    'carly calendars list --pretty',
  ],
  inputSchema: z.object({}),
  cliMappings: {},
  endpoint: { method: 'GET', path: '/calendars' },
  fieldMappings: {},
  defaultColumns: ['provider', 'account_email', 'label', 'key'],
  handler: (input, client) => executeCommand(calendarsListCommand, input, client),
};

export const calendarsCommands: CommandDefinition[] = [calendarsListCommand];
