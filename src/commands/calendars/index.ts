import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const calendarsListCommand: CommandDefinition = {
  name: 'calendars_list',
  group: 'calendars',
  subcommand: 'list',
  description: 'List connected calendars for the authenticated user. The `selected` field mirrors the "Check for conflicts on" state in the web UI — calendars with `selected: true` count against booking-page availability.',
  examples: [
    'carly calendars list',
    'carly calendars list --output table',
    'carly calendars list --pretty',
  ],
  inputSchema: z.object({}),
  cliMappings: {},
  endpoint: { method: 'GET', path: '/calendars' },
  fieldMappings: {},
  defaultColumns: ['provider', 'account_email', 'label', 'selected', 'key'],
  handler: (input, client) => executeCommand(calendarsListCommand, input, client),
};

const _calendarKeyArg = {
  name: 'calendar-key',
  field: 'calendar_key' as const,
  required: true,
};

export const calendarsSelectCommand: CommandDefinition = {
  name: 'calendars_select',
  group: 'calendars',
  subcommand: 'select',
  description:
    'Mark a calendar as counting against booking-page availability ("Check for conflicts on"). Requires the `booking_pages:write` scope. The flag is account-wide — every booking page on this calendar\'s integration will honor it on the next availability check.',
  examples: [
    'carly calendars select "google::371::primary"',
    'carly calendars select "google::371::team@example.com" --pretty',
  ],
  inputSchema: z.object({
    calendar_key: z.string().trim().min(1),
  }),
  cliMappings: {
    args: [_calendarKeyArg],
  },
  endpoint: { method: 'POST', path: '/calendars/select' },
  fieldMappings: {
    calendar_key: 'body',
    selected: 'body',
  },
  handler: (input, client) =>
    executeCommand(calendarsSelectCommand, { ...input, selected: true }, client),
};

export const calendarsUnselectCommand: CommandDefinition = {
  name: 'calendars_unselect',
  group: 'calendars',
  subcommand: 'unselect',
  description:
    'Stop counting a calendar against booking-page availability. Requires the `booking_pages:write` scope. Inverse of `carly calendars select`.',
  examples: ['carly calendars unselect "google::371::team@example.com"'],
  inputSchema: z.object({
    calendar_key: z.string().trim().min(1),
  }),
  cliMappings: {
    args: [_calendarKeyArg],
  },
  endpoint: { method: 'POST', path: '/calendars/select' },
  fieldMappings: {
    calendar_key: 'body',
    selected: 'body',
  },
  handler: (input, client) =>
    executeCommand(calendarsUnselectCommand, { ...input, selected: false }, client),
};

export const calendarsCommands: CommandDefinition[] = [
  calendarsListCommand,
  calendarsSelectCommand,
  calendarsUnselectCommand,
];
