import { Pool, PoolClient } from 'pg';
import { AsyncLocalStorage } from 'async_hooks';

// Context interface containing tenant and user information
export interface TenantContext {
  tenantId: string;
  userId?: string;
  bypassRls?: boolean;
}

// Global store for the async request lifecycle
export const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ewatu:ewatu_dev@localhost:15432/payroll_db',
});

/**
 * Execute a query inside a transaction block where RLS parameters are set.
 * This guarantees that session state is bounded strictly to this specific query.
 */
export async function executeQuery<T = any>(
  text: string,
  params: any[] = []
): Promise<T[]> {
  const ctx = tenantContextStorage.getStore();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    if (ctx?.bypassRls) {
      await client.query("SET LOCAL app.bypass_rls = 'true'");
    } else if (ctx?.tenantId) {
      await client.query("SET LOCAL app.current_tenant_id = $1", [ctx.tenantId]);
    } else {
      // If no context and not bypassed, enforce strict empty setting so RLS fails shut
      await client.query("SET LOCAL app.current_tenant_id = ''");
    }

    const res = await client.query(text, params);
    await client.query('COMMIT');
    return res.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute multiple database operations within a single multi-query transaction block.
 */
export async function executeTransaction<T = any>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const ctx = tenantContextStorage.getStore();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (ctx?.bypassRls) {
      await client.query("SET LOCAL app.bypass_rls = 'true'");
    } else if (ctx?.tenantId) {
      await client.query("SET LOCAL app.current_tenant_id = $1", [ctx.tenantId]);
    } else {
      await client.query("SET LOCAL app.current_tenant_id = ''");
    }

    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
