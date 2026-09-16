#!/usr/bin/env node
/**
 * Runs automatically before `npm run dev` / `npm run dev:all` (see predev / predev:all
 * in package.json). Kills anything already bound to e-watu's dev ports so a stale
 * process tree left running from a closed terminal (common on Windows, where closing
 * a terminal doesn't kill its child processes) can't collide with a fresh start.
 *
 * Only ever kills node.exe processes on these specific ports — never touches Postgres,
 * MinIO, Mailpit, or anything unrelated.
 */
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORTS = [3011, 3012, 3013, 3014, 3015, 3016, 3018, 3020, 3021, 5173];

function freeWindows() {
  const ports = PORTS.join(',');
  const script = `
$ports = @(${ports})
$killed = @()
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $ports -contains $_.LocalPort } |
  ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -eq 'node') {
      Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
      $killed += "$($_.LocalPort) (pid $($proc.Id))"
    }
  }
if ($killed.Count -gt 0) { $killed -join ";" }
`;
  const scriptPath = join(tmpdir(), `ewatu-free-dev-ports-${process.pid}.ps1`);
  writeFileSync(scriptPath, script, 'utf8');
  try {
    const out = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`, {
      encoding: 'utf8',
    }).trim();
    return out ? out.split(';').filter(Boolean) : [];
  } finally {
    try {
      unlinkSync(scriptPath);
    } catch {
      // best effort
    }
  }
}

function freePosix() {
  const killed = [];
  for (const port of PORTS) {
    let pids = '';
    try {
      pids = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
    } catch {
      continue; // nothing listening on this port
    }
    for (const pid of pids.split('\n').filter(Boolean)) {
      try {
        const name = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf8' }).trim();
        if (name.includes('node')) {
          execSync(`kill -9 ${pid}`);
          killed.push(`${port} (pid ${pid})`);
        }
      } catch {
        // process already gone
      }
    }
  }
  return killed;
}

const killed = process.platform === 'win32' ? freeWindows() : freePosix();

if (killed.length > 0) {
  console.log(`free-dev-ports: killed stale processes on ${killed.join(', ')}`);
} else {
  console.log('free-dev-ports: all ports clear');
}
