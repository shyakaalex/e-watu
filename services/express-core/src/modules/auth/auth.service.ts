import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import { executeTransaction, tenantContextStorage } from '../../db/client';

const saltRounds = 10;

// Load private key if exists for signing RS256 JWTs
let privateKey: string | Buffer = '';
try {
  if (process.env.JWT_PRIVATE_KEY) {
    privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n').trim();
  } else {
    const rootPemPath = path.resolve(__dirname, '../../../../private.pem');
    const localPemPath = path.resolve(__dirname, '../../../private.pem');
    if (fs.existsSync(rootPemPath)) {
      privateKey = fs.readFileSync(rootPemPath);
    } else if (fs.existsSync(localPemPath)) {
      privateKey = fs.readFileSync(localPemPath);
    }
  }
} catch (e) {
  console.warn('Could not load JWT private key for RS256. Falling back to HS256.');
}

/**
 * Register a new tenant along with its owner admin user
 */
export async function registerTenant(name: string, slug: string, email: string, passwordHash: string, displayName: string) {
  // Use bypassRls: true to query/insert across tenants table without active session tenantId
  return tenantContextStorage.run({ tenantId: '', bypassRls: true }, async () => {
    return executeTransaction(async (client) => {
      // 1. Create Tenant
      const tenantRes = await client.query(
        `INSERT INTO tenants (name, slug, status) VALUES ($1, $2, 'ACTIVE') RETURNING id, name, slug`,
        [name, slug]
      );
      const tenant = tenantRes.rows[0];

      // 2. Create default Admin Role for this Tenant
      const roleRes = await client.query(
        `INSERT INTO roles (tenant_id, name, permissions) VALUES ($1, 'TENANT_ADMIN', $2) RETURNING id, name`,
        [tenant.id, ['payroll:write', 'payroll:read', 'recruitment:write', 'recruitment:read']]
      );
      const role = roleRes.rows[0];

      // 3. Hash password and Create Admin User
      const passwordHashString = await bcrypt.hash(passwordHash, saltRounds);
      const userRes = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, display_name, active) VALUES ($1, $2, $3, $4, TRUE) RETURNING id, email, display_name`,
        [tenant.id, email, passwordHashString, displayName]
      );
      const user = userRes.rows[0];

      // 4. Assign Admin Role to User
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [user.id, role.id]
      );

      // 5. Add audit log
      await client.query(
        `INSERT INTO audit_logs (tenant_id, user_id, action, resource, resource_id, payload)
         VALUES ($1, $2, 'TENANT_REGISTRATION', 'tenants', $3, $4)`,
        [tenant.id, user.id, tenant.id, JSON.stringify({ slug, email })]
      );

      return { tenant, user };
    });
  });
}

/**
 * Log in a user and return an access token
 */
export async function loginUser(email: string, passwordPlain: string) {
  return tenantContextStorage.run({ tenantId: '', bypassRls: true }, async () => {
    const userQuery = `
      SELECT u.id, u.tenant_id, u.email, u.password_hash, u.display_name, u.active,
             ARRAY_AGG(r.name) as roles,
             ARRAY_AGG(r.permissions) as permissions_grouped
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
      GROUP BY u.id
    `;
    
    const userRes = await executeTransaction(async (client) => {
      const res = await client.query(userQuery, [email]);
      return res.rows;
    });

    if (userRes.length === 0) {
      throw new Error('Invalid email or password.');
    }

    const user = userRes[0];
    if (!user.active) {
      throw new Error('User account is suspended.');
    }

    const valid = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!valid) {
      throw new Error('Invalid email or password.');
    }

    // Flatten permissions list
    const permissionsSet = new Set<string>();
    if (user.permissions_grouped) {
      user.permissions_grouped.forEach((group: string[]) => {
        if (group) group.forEach(p => permissionsSet.add(p));
      });
    }

    // Sign JWT
    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      roles: user.roles.filter(Boolean),
      permissions: Array.from(permissionsSet)
    };

    const secret = privateKey || process.env.JWT_SECRET || 'ewatu_secret';
    const token = jwt.sign(payload, secret, {
      algorithm: privateKey ? 'RS256' : 'HS256',
      expiresIn: '24h',
      issuer: process.env.JWT_ISSUER || 'http://localhost:3011/auth'
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        tenantId: user.tenant_id,
        roles: payload.roles,
        permissions: payload.permissions
      }
    };
  });
}
