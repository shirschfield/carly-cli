import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const eventTypesListCommand: CommandDefinition = {
  name: 'event_types_list',
  group: 'event-types',
  subcommand: 'list',
  description:
    "List event types. Without --username, returns the authenticated caller's own event types. With --username, returns that public profile's active event types.",
  examples: [
    'carly event-types list',
    'carly event-types list --username bailey',
    'carly event-types list --output table',
  ],
  inputSchema: z.object({
    username: z.string().trim().toLowerCase().optional(),
  }),
  cliMappings: {
    options: [
      { flags: '--username <username>', field: 'username', description: "Filter to this profile's active event types instead of the caller's" },
    ],
  },
  endpoint: { method: 'GET', path: '/event-types' },
  fieldMappings: { username: 'query' },
  defaultColumns: ['id', 'username', 'slug', 'title', 'length', 'is_active'],
  handler: (input, client) => executeCommand(eventTypesListCommand, input, client),
};

export const eventTypesCommands: CommandDefinition[] = [eventTypesListCommand];
