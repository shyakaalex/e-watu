import { Router, Request, Response } from 'express';
import { registerTenant, loginUser } from './auth.service';

const router = Router();

/**
 * POST /api/v1/auth/register
 * onboarding route to register a new tenant and admin user.
 */
router.post('/register', async (req: Request, res: Response) => {
  const { name, slug, email, password, displayName } = req.body;

  if (!name || !slug || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields: name, slug, email, password' });
  }

  try {
    const result = await registerTenant(name, slug, email, password, displayName || name);
    return res.status(201).json({ message: 'Tenant registered successfully', ...result });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/auth/login
 * authenticate a user and generate token.
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields: email, password' });
  }

  try {
    const result = await loginUser(email, password);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(401).json({ error: error.message });
  }
});

export default router;
