export interface AuthUser {
  sub: string;
  preferred_username?: string;
  email?: string;
  tenant_id?: string;
  roles: string[];
  raw: Record<string, unknown>;
}
