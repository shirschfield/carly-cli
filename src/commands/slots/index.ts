import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const slotsListCommand: CommandDefinition = {
  name: 'slots_list',
  group: 'slots',
  subcommand: 'list',
  description:
    'List available booking slots in a time range. Provide either --event-type-id, or both --username and --event-type-slug.',
  examples: [
    'carly slots list --event-type-id 42 --start-time 2026-05-01T00:00:00Z --end-time 2026-05-07T23:59:59Z',
    'carly slots list --username bailey --event-type-slug 15min --start-time 2026-05-01T00:00:00Z --end-time 2026-05-07T23:59:59Z',
    'carly slots list --event-type-id 42 --start-time 2026-05-01T00:00:00Z --end-time 2026-05-02T00:00:00Z --output table',
  ],
  inputSchema: z.object({
    eventTypeId: z.coerce.number().int().positive().optional(),
    username: z.string().trim().toLowerCase().optional(),
    eventTypeSlug: z.string().trim().optional(),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    duration: z.coerce.number().int().positive().optional(),
  }),
  cliMappings: {
    options: [
      { flags: '--event-type-id <id>', field: 'eventTypeId', description: 'Event type ID' },
      { flags: '--username <username>', field: 'username', description: 'Profile username (with --event-type-slug)' },
      { flags: '--event-type-slug <slug>', field: 'eventTypeSlug', description: 'Event type slug (with --username)' },
      { flags: '--start-time <iso>', field: 'startTime', description: 'Range start (ISO 8601)' },
      { flags: '--end-time <iso>', field: 'endTime', description: 'Range end (ISO 8601)' },
      { flags: '--duration <minutes>', field: 'duration', description: 'Override slot duration (minutes)' },
    ],
  },
  endpoint: { method: 'GET', path: '/slots' },
  fieldMappings: {
    eventTypeId: 'query',
    username: 'query',
    eventTypeSlug: 'query',
    startTime: 'query',
    endTime: 'query',
    duration: 'query',
  },
  defaultColumns: ['date', 'start', 'end'],
  handler: (input, client) => {
    if (input.eventTypeId === undefined && !(input.username && input.eventTypeSlug)) {
      throw new Error('Must provide either --event-type-id, or both --username and --event-type-slug');
    }
    return executeCommand(slotsListCommand, input, client);
  },
};

export const slotsCommands: CommandDefinition[] = [slotsListCommand];
