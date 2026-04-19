import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_DIR = join(homedir(), '.carly-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface CarlyConfig {
  apiKey?: string;
  apiBaseUrl?: string;
  user_id?: number;
  user_email?: string;
}

export async function loadConfig(): Promise<CarlyConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(raw) as CarlyConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(config: CarlyConfig): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
  // chmod is best-effort — Windows ignores it.
  try {
    await chmod(CONFIG_DIR, 0o700);
  } catch {}
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export async function clearConfig(): Promise<void> {
  await saveConfig({});
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
