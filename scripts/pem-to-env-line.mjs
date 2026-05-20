#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const kind = process.argv[2] || 'public';
const file =
  kind === 'private'
    ? join(root, 'infra/dev-jwt/private.pem')
    : join(root, 'infra/dev-jwt/public.pem');
const pem = readFileSync(file, 'utf8').trim();
const oneLine = pem.replace(/\n/g, '\\n');
console.log(oneLine);
