import type { TenantRow } from '../api';

const VAR_MAP: Record<string, keyof TenantRow> = {
  '--tenant-primary': 'primaryColor',
  '--tenant-secondary': 'secondaryColor',
  '--tenant-accent': 'accentColor',
  '--tenant-background': 'backgroundColor',
  '--tenant-text': 'textColor',
};

/** Injects (or clears) the tenant's custom brand colors as CSS custom properties on the
 *  root element. Every themed rule in index.css reads these via var(--tenant-x, <default>),
 *  so a tenant can set as few as one color and everything else keeps the app's default look. */
export function applyTenantTheme(tenant: TenantRow | null | undefined): void {
  const root = document.documentElement.style;
  for (const [cssVar, field] of Object.entries(VAR_MAP)) {
    const value = tenant?.[field];
    if (typeof value === 'string' && value.trim()) {
      root.setProperty(cssVar, value.trim());
    } else {
      root.removeProperty(cssVar);
    }
  }
}
