import { SetMetadata } from '@nestjs/common';

export const TENANT_STATUS_KEY = 'ewatu_allowed_tenant_statuses';

/** Marks a route as reachable even when the caller's tenant is in one of these non-active statuses. */
export const AllowTenantStatus = (...statuses: string[]) => SetMetadata(TENANT_STATUS_KEY, statuses);
