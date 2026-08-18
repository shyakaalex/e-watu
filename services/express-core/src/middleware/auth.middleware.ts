import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import { tenantContextStorage, TenantContext } from '../db/client';

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  tenant_id?: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      user?: AuthenticatedUser;
    }
  }
}

let publicKey: string | Buffer = '';
try {
  if (process.env.JWT_PUBLIC_KEY) {
    publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n').trim();
  } else {
    // Look in root folder (../../../../public.pem) relative to this compiled/source code path
    const rootPemPath = path.resolve(__dirname, '../../../../public.pem');
    const localPemPath = path.resolve(__dirname, '../../../public.pem'); // in services/express-core/public.pem if copied
    
    if (fs.existsSync(rootPemPath)) {
      publicKey = fs.readFileSync(rootPemPath);
    } else if (fs.existsSync(localPemPath)) {
      publicKey = fs.readFileSync(localPemPath);
    }
  }
} catch (e) {
  console.warn('Could not load JWT public key: ', e);
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = publicKey || process.env.JWT_SECRET || 'ewatu_secret';
    const decoded = jwt.verify(token, secret, {
      algorithms: publicKey ? ['RS256'] : ['HS256', 'RS256'],
    }) as any;

    const user: AuthenticatedUser = {
      sub: decoded.sub,
      email: decoded.email,
      tenant_id: decoded.tenant_id || decoded.tenantId,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    };

    req.user = user;

    // Strict Multi-Tenancy mandate: tenant_id MUST strictly be extracted from JWT payload
    if (!user.tenant_id) {
      return res.status(403).json({ error: 'Tenant context missing in authentication token' });
    }

    req.tenantId = user.tenant_id;

    // Configure the request-scoped context
    const context: TenantContext = {
      tenantId: user.tenant_id,
      userId: user.sub,
      bypassRls: user.roles.includes('SUPER_ADMIN'),
    };

    // Propagate context asynchronously across controllers and DB queries
    tenantContextStorage.run(context, () => {
      next();
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to check specific role authorization.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole && !req.user.roles.includes('SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Forbidden: insufficient role permissions' });
    }
    next();
  };
}
