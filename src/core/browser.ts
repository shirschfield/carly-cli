import { spawn } from 'node:child_process';

/**
 * Open a URL in the user's default browser. No-op on failure — we still print
 * the URL so the user can click/paste manually.
 *
 * Uses `spawn` with an args array (no shell interpolation) so untrusted URL
 * strings can't inject commands. URLs here come from our config, but we use
 * the safe path by default.
 */
export function openInBrowser(url: string): boolean {
  const plat = process.platform;
  let cmd: string;
  let args: string[];

  if (plat === 'darwin') {
    cmd = 'open';
    args = [url];
  } else if (plat === 'win32') {
    // `start` is a shell builtin; invoke via cmd /c and pass an empty window
    // title as the first arg (otherwise "start <url-with-spaces>" gets parsed
    // as the title).
    cmd = 'cmd';
    args = ['/c', 'start', '""', url];
  } else {
    cmd = 'xdg-open';
    args = [url];
  }

  try {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    child.on('error', () => {
      /* fall through — caller still prints the URL */
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}
