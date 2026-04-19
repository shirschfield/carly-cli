import type { Command } from 'commander';
import { CarlyClient } from '../../core/client.js';
import { saveConfig, loadConfig, getConfigPath } from '../../core/config.js';
import { DEFAULT_API_BASE_URL } from '../../core/auth.js';

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with your Carly API key (validates against /api/v1/whoami)')
    .action(async (_opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals();
      let apiKey = globalOpts.apiKey as string | undefined;
      const baseUrl = ((globalOpts.apiBaseUrl as string | undefined) ?? process.env.CARLY_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, '');

      if (!apiKey) {
        if (process.env.CARLY_API_KEY) {
          apiKey = process.env.CARLY_API_KEY;
        } else {
          console.error(`Mint a key at ${baseUrl}/advanced (Advanced tab → API Keys → Generate key).`);
          try {
            const { password } = await import('@inquirer/prompts');
            apiKey = await password({
              message: 'Paste your Carly API key (carly_live_…):',
              mask: '*',
            });
          } catch {
            console.error(
              'Interactive prompts not available. Use:\n' +
                '  CARLY_API_KEY=<key> carly login\n' +
                '  or: carly --api-key <key> login',
            );
            process.exit(1);
          }
        }
      }

      apiKey = apiKey?.trim();
      if (!apiKey) {
        console.error('API key cannot be empty.');
        process.exit(1);
      }

      console.error('Validating API key...');
      const client = new CarlyClient({ apiKey, baseUrl });

      let user: { id?: number; email?: string };
      try {
        const res = await client.get<{ user?: { id?: number; email?: string } }>('/whoami');
        user = res?.user ?? {};
      } catch (err: any) {
        const status = err?.statusCode ?? '';
        const help = status === 401 || status === 403
          ? `\nGet a new key at ${baseUrl}/advanced`
          : '';
        console.error(`Authentication failed: ${err?.message ?? err}${help}`);
        process.exit(1);
      }

      const existing = await loadConfig();
      await saveConfig({
        ...existing,
        apiKey,
        apiBaseUrl: baseUrl,
        user_id: user.id,
        user_email: user.email,
      });

      const identity = user.email ?? (user.id ? `user #${user.id}` : 'unknown');
      console.log(JSON.stringify(
        {
          status: 'authenticated',
          email: user.email ?? null,
          id: user.id ?? null,
          api_base_url: baseUrl,
          config_path: getConfigPath(),
        },
        null,
        2,
      ));
      console.error(`Logged in as ${identity}`);
    });
}
