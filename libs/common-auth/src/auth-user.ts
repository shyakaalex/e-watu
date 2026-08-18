export interface AuthUser {
  sub: string;
  preferred_username?: string;
  email?: string;
  tenant_id?: string;
  tenant_status?: string;
  roles: string[];
  permissions: string[];
  raw: Record<string, unknown>;
}
