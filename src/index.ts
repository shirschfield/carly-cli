import { Command } from 'commander';
import { createRequire } from 'node:module';
import { registerAllCommands } from './commands/index.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('carly')
  .description('Agent-native CLI and MCP server for Carly — the AI scheduling assistant')
  .version(version)
  .option('--api-key <key>', 'Carly API key (overrides env/config)')
  .option('--api-base-url <url>', 'Override the Carly API base URL')
  .option('--output <format>', 'Output format: json (default), pretty, or table')
  .option('--pretty', 'Shortcut for --output pretty')
  .option('--quiet', 'Suppress output (exit code only)')
  .option('--fields <fields>', 'Comma-separated fields. Narrows JSON keys; orders table columns.');

registerAllCommands(program);

program.parse(process.argv);
