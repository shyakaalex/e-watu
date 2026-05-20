/** Read a PEM key from env (supports literal newlines or `\\n` escapes). */
export function readJwtPemFromEnv(value: string | undefined, envName: string): string {
  if (!value?.trim()) {
    throw new Error(`Missing ${envName}`);
  }
  return value.replace(/\\n/g, '\n').trim();
}
