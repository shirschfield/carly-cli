import type { Command } from 'commander';
import { clearConfig, getConfigPath } from '../../core/config.js';

export function registerLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Remove stored Carly credentials')
    .action(async () => {
      await clearConfig();
      console.log(JSON.stringify({ status: 'logged_out', config_path: getConfigPath() }));
    });
}
