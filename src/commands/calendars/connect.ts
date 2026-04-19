import type { Command } from 'commander';
import { openInBrowser } from '../../core/browser.js';
import { DEFAULT_API_BASE_URL } from '../../core/auth.js';

/**
 * Calendar/video-provider connect URLs on the dashboard. These endpoints
 * kick off a standard OAuth redirect to Google / Microsoft / Zoom and
 * handle both first-time signup and "add another account" in the same
 * handler (signup-if-new, add-account-if-signed-in).
 *
 * `next=/booking-pages/new?from_cli=true` keeps npm users out of the
 * full Carly AI assistant welcome flow — they land on the booking-pages
 * surface, which auto-opens the "Generate API key" card for CLI signups.
 */
const POST_OAUTH_NEXT = '/booking-pages?from_cli=true';

const CONNECT_PATHS: Record<string, string> = {
  google: `/api/authorize?next=${encodeURIComponent(POST_OAUTH_NEXT)}`,
  microsoft: `/api/outlook/authorize?next=${encodeURIComponent(POST_OAUTH_NEXT)}`,
  outlook: `/api/outlook/authorize?next=${encodeURIComponent(POST_OAUTH_NEXT)}`,
  zoom: `/api/zoom/authorize?next=${encodeURIComponent(POST_OAUTH_NEXT)}`,
};

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  microsoft: 'Microsoft (Outlook + Teams)',
  outlook: 'Microsoft (Outlook + Teams)',
  zoom: 'Zoom',
};

function resolveBaseUrl(globalOpts: { apiBaseUrl?: string }): string {
  return (globalOpts.apiBaseUrl ?? process.env.CARLY_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

function printConnectInstructions(provider: string, url: string, opened: boolean): void {
  const label = PROVIDER_LABELS[provider] ?? provider;
  if (opened) {
    console.error(`Opening the ${label} consent page in your browser...`);
  } else {
    console.error(`Could not auto-launch your browser. Open this URL to connect ${label}:`);
  }
  console.error(`  ${url}`);
  console.error('');
  console.error('After you approve, your calendar is linked to your Carly account.');
  if (provider === 'zoom') {
    console.error('Zoom requires an existing Carly account — you\'ll be asked to sign in first.');
  }
  console.error('Run `carly calendars list` once you\'re back to confirm.');
}

export function registerCalendarsConnectCommand(program: Command): void {
  const calendars = program.commands.find((c) => c.name() === 'calendars');
  // If the `calendars` group hasn't been registered yet (command order), bail
  // — the standard command registration in commands/index.ts creates it.
  if (!calendars) return;

  calendars
    .command('connect <provider>')
    .description('Connect a calendar or video provider via browser OAuth (google | microsoft | zoom)')
    .addHelpText(
      'after',
      '\nExamples:\n' +
        '  carly calendars connect google      # Google Calendar (and sign up if you don\'t have an account)\n' +
        '  carly calendars connect microsoft   # Outlook calendar + Teams\n' +
        '  carly calendars connect zoom        # Zoom (requires existing Carly account)\n',
    )
    .action(async (provider: string, _opts, cmd) => {
      const key = provider.toLowerCase();
      const path = CONNECT_PATHS[key];
      if (!path) {
        console.error(`Unknown provider: ${provider}`);
        console.error(`Supported: ${Object.keys(CONNECT_PATHS).filter((k) => k !== 'outlook').join(', ')}`);
        process.exit(2);
      }

      const globalOpts = cmd.optsWithGlobals() as { apiBaseUrl?: string };
      const baseUrl = resolveBaseUrl(globalOpts);
      const url = `${baseUrl}${path}`;

      const opened = openInBrowser(url);
      printConnectInstructions(key, url, opened);
    });
}

/**
 * Top-level `carly signup` — friendly alias for `calendars connect google`
 * for fresh installs where the user doesn't even have an account yet.
 */
export function registerSignupCommand(program: Command): void {
  program
    .command('signup')
    .description('Create a Carly account by connecting a Google or Outlook calendar (browser OAuth)')
    .option('--with <provider>', 'Sign up with google (default) or microsoft', 'google')
    .action(async (opts, cmd) => {
      const provider = (opts.with as string).toLowerCase();
      if (provider !== 'google' && provider !== 'microsoft' && provider !== 'outlook') {
        console.error(`signup --with must be 'google' or 'microsoft'. Got: ${provider}`);
        process.exit(2);
      }
      const path = CONNECT_PATHS[provider];
      const globalOpts = cmd.optsWithGlobals() as { apiBaseUrl?: string };
      const baseUrl = resolveBaseUrl(globalOpts);
      const url = `${baseUrl}${path}`;

      const opened = openInBrowser(url);
      printConnectInstructions(provider, url, opened);
      console.error('');
      console.error('You\'ll land on the booking-pages page after sign-in. Click "Generate API key"');
      console.error('in the card there, copy the key, then run:');
      console.error('  carly login --api-key <paste-key>');
    });
}
