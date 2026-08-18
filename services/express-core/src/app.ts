import express, { Request, Response, NextFunction } from 'express';
import authRoutes from './modules/auth/auth.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import recruitmentRoutes from './modules/recruitment/recruitment.routes';

import tenantsRoutes from './modules/tenants/tenants.routes';
import outsourcingRoutes from './modules/outsourcing/outsourcing.routes';
import clientPortalRoutes from './modules/client-portal/client-portal.routes';
import financeRoutes from './modules/finance/finance.routes';
import documentsRoutes from './modules/documents/documents.routes';
import immigrationRoutes from './modules/immigration/immigration.routes';

const app = express();

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers helper
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Mounting modules
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/recruitment', recruitmentRoutes);
app.use('/api/v1/tenants', tenantsRoutes);
app.use('/api/v1/outsourcing', outsourcingRoutes);
app.use('/api/v1/client-portal', clientPortalRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/immigration', immigrationRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', service: 'express-core', timestamp: new Date() });
});

// 404 Route handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(status).json({ error: message });
});

export default app;
