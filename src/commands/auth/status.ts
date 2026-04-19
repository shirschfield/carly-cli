import type { Command } from 'commander';
import { loadConfig, getConfigPath } from '../../core/config.js';
import { DEFAULT_API_BASE_URL } from '../../core/auth.js';

type AuthSource = 'flag' | 'env' | 'config' | 'none';

export function registerAuthStatusCommand(program: Command): void {
  program
    .command('auth-status')
    .description('Show current authentication status (checks --api-key flag, CARLY_API_KEY env, and saved config)')
    .action(async (_opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as { apiKey?: string; apiBaseUrl?: string };
      const config = await loadConfig();

      let source: AuthSource = 'none';
      let apiBaseUrl: string | null = null;

      if (globalOpts.apiKey) {
        source = 'flag';
      } else if (process.env.CARLY_API_KEY) {
        source = 'env';
      } else if (config.apiKey) {
        source = 'config';
      }

      if (source !== 'none') {
        // Same priority chain as resolveAuth, kept local to avoid a network call.
        apiBaseUrl = (
          globalOpts.apiBaseUrl ??
          process.env.CARLY_API_BASE_URL ??
          config.apiBaseUrl ??
          DEFAULT_API_BASE_URL
        ).replace(/\/+$/, '');
      }

      const payload: Record<string, unknown> = {
        status: source === 'none' ? 'unauthenticated' : 'authenticated',
        source,
        api_base_url: apiBaseUrl,
        config_path: getConfigPath(),
      };

      // Identity fields are only trustworthy when the active key is the
      // saved one. An exported env var or --api-key flag could belong to a
      // different user than the one in config; reporting the stale identity
      // would mislead.
      if (source === 'config') {
        payload.email = config.user_email ?? null;
        payload.user_id = config.user_id ?? null;
      }

      if (source === 'none') {
        payload.message = 'Run: carly login (or set CARLY_API_KEY)';
      } else if (source === 'env' || source === 'flag') {
        payload.hint = `Key resolved from ${source}; not stored on disk. Run \`carly login\` to persist for headless launches (e.g. Claude Desktop spawning the MCP server).`;
      }

      console.log(JSON.stringify(payload, null, 2));
    });
}
