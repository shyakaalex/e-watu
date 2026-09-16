/** IPv4-only allowlist matching for the office-network attendance restriction. */

function ipv4ToLong(ip: string): number | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return null;
  const [a, b, c, d] = m.slice(1, 5).map(Number);
  if ([a, b, c, d].some((o) => o === undefined || o > 255)) return null;
  return (((a as number) << 24) | ((b as number) << 16) | ((c as number) << 8) | (d as number)) >>> 0;
}

/** Strips the "::ffff:" prefix Express/Node add to IPv4 addresses on a dual-stack socket. */
export function normalizeIp(ip: string): string {
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

function splitCidr(value: string): [string, string | undefined] {
  const idx = value.indexOf('/');
  return idx === -1 ? [value, undefined] : [value.slice(0, idx), value.slice(idx + 1)];
}

export function isValidCidr(value: string): boolean {
  const [ip, prefixStr] = splitCidr(value);
  if (ipv4ToLong(ip) === null) return false;
  if (prefixStr === undefined) return true;
  const prefix = Number(prefixStr);
  return Number.isInteger(prefix) && prefix >= 0 && prefix <= 32;
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  const [rangeIp, prefixStr] = splitCidr(cidr);
  const prefix = prefixStr === undefined ? 32 : Number(prefixStr);
  const ipLong = ipv4ToLong(normalizeIp(ip));
  const rangeLong = ipv4ToLong(rangeIp);
  if (ipLong === null || rangeLong === null || Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;
  if (prefix === 0) return true;
  const mask = prefix === 32 ? 0xffffffff : (~0 << (32 - prefix)) >>> 0;
  return (ipLong & mask) === (rangeLong & mask);
}

export function isIpAllowed(ip: string, cidrs: string[]): boolean {
  return cidrs.some((cidr) => isIpInCidr(ip, cidr));
}
