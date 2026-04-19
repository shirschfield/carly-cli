import type { GlobalOptions } from './types.js';
import { formatError } from './errors.js';

type OutputFormat = 'json' | 'pretty' | 'table';

const VALID_FORMATS: OutputFormat[] = ['json', 'pretty', 'table'];

export function output(data: unknown, opts: GlobalOptions, defaultColumns?: string[]): void {
  if (opts.quiet) return;

  const format = resolveFormat(opts);

  let result = data;

  // --fields trims visible keys in JSON modes, and narrows/orders columns in table mode.
  const fieldList = opts.fields
    ? opts.fields.split(',').map((f) => f.trim()).filter(Boolean)
    : undefined;

  if (format === 'table') {
    const rows = extractRows(result);
    if (rows === null) {
      // No array-shaped payload — fall back to pretty JSON, but warn to stderr
      // so scripts that pipe --output table get a visible hint.
      console.error('(table output not supported for this response shape — showing pretty JSON)');
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    const columns = fieldList ?? defaultColumns ?? inferColumns(rows);
    console.log(renderTable(rows, columns));
    return;
  }

  if (fieldList) {
    result = pickFields(result, fieldList);
  }

  const pretty = format === 'pretty';
  console.log(pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result));
}

export function outputError(error: unknown, opts: GlobalOptions): void {
  if (!opts.quiet) {
    console.error(formatError(error));
  }
  process.exit(1);
}

function resolveFormat(opts: GlobalOptions): OutputFormat {
  if (opts.output) {
    if (!VALID_FORMATS.includes(opts.output as OutputFormat)) {
      throw new Error(
        `Invalid --output value: ${opts.output}. Must be one of: ${VALID_FORMATS.join(', ')}`,
      );
    }
    return opts.output as OutputFormat;
  }
  if (opts.pretty) return 'pretty';
  return 'json';
}

function pickFields(data: unknown, fields: string[]): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => pickFields(item, fields));
  }
  if (data !== null && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    // Unwrap Carly's `{items: [...]}` envelope so --fields filters the rows
    // rather than the wrapper. Keep the envelope key so output shape is stable.
    if (Array.isArray(obj.items)) {
      return { ...obj, items: (obj.items as unknown[]).map((item) => pickFields(item, fields)) };
    }
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      if (f in obj) out[f] = obj[f];
    }
    return out;
  }
  return data;
}

/**
 * Pull rows out of an API response for table rendering.
 *
 * Handles:
 *   - `{items: [...]}`       → the items array
 *   - `{slots: {date: [...]}}` → flattened `[{date, start, end, ...}]`
 *   - plain array            → returned as-is
 *   - single object          → null (caller falls back to JSON)
 */
function extractRows(data: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(data)) {
    return data.filter((r) => r !== null && typeof r === 'object') as Record<string, unknown>[];
  }
  if (data === null || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  if (Array.isArray(obj.items)) {
    return (obj.items as unknown[]).filter(
      (r) => r !== null && typeof r === 'object',
    ) as Record<string, unknown>[];
  }

  // Slots response: {"slots": {"2026-05-01": [{start, end}, ...], ...}}
  if (obj.slots !== null && typeof obj.slots === 'object' && !Array.isArray(obj.slots)) {
    const out: Record<string, unknown>[] = [];
    for (const [date, slots] of Object.entries(obj.slots as Record<string, unknown>)) {
      if (!Array.isArray(slots)) continue;
      for (const s of slots) {
        if (s === null || typeof s !== 'object') continue;
        out.push({ date, ...(s as Record<string, unknown>) });
      }
    }
    return out;
  }

  return null;
}

function inferColumns(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return [];
  const first = rows[0];
  // Show only scalar-valued keys; nested objects/arrays aren't useful in a table.
  return Object.keys(first).filter((k) => isScalar(first[k]));
}

function isScalar(v: unknown): boolean {
  return v === null || ['string', 'number', 'boolean'].includes(typeof v);
}

function renderTable(rows: Record<string, unknown>[], columns: string[]): string {
  if (columns.length === 0) return '(empty)';

  const header = columns;
  const body = rows.map((r) => columns.map((c) => formatCell(r[c])));

  const widths = header.map((h, i) =>
    Math.max(h.length, ...body.map((row) => row[i].length)),
  );

  const lines: string[] = [];
  lines.push(header.map((h, i) => h.padEnd(widths[i])).join('  '));
  lines.push(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const row of body) {
    lines.push(row.map((v, i) => v.padEnd(widths[i])).join('  '));
  }
  if (rows.length === 0) {
    lines.push('(no rows)');
  }
  return lines.join('\n');
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  // Objects/arrays get collapsed to JSON so the table stays rectangular.
  return JSON.stringify(v);
}
