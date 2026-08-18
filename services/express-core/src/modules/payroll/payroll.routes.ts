import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { initiatePayrollRun, advancePayrollStatus } from './payroll.service';

const router = Router();

// Apply authentication and tenancy isolation middleware to all routes in this module
router.use(authMiddleware);

/**
 * POST /api/v1/payroll/runs
 * Initiates a new payroll run for a specific client and period.
 */
router.post('/runs', async (req: Request, res: Response) => {
  const { clientId, periodMonth, periodYear } = req.body;

  if (!clientId || !periodMonth || !periodYear) {
    return res.status(400).json({ error: 'Missing required parameters: clientId, periodMonth, periodYear' });
  }

  try {
    const run = await initiatePayrollRun(
      req.tenantId!,
      clientId,
      Number(periodMonth),
      Number(periodYear),
      req.user!.sub
    );
    return res.status(201).json({ message: 'Payroll run initiated successfully', run });
  } catch (error: any) {
    console.error('Error initiating payroll run:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/payroll/runs/:id/status
 * Advances the payroll run to the next step of the approval lifecycle (FO -> HR -> MD -> Client -> LOCKED).
 */
router.put('/runs/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, comments } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Missing required parameter: status' });
  }

  try {
    const run = await advancePayrollStatus(
      req.tenantId!,
      id,
      status,
      req.user!.sub,
      comments
    );
    return res.status(200).json({ message: `Payroll run status advanced to ${status}`, run });
  } catch (error: any) {
    console.error('Error advancing payroll run status:', error);
    return res.status(400).json({ error: error.message });
  }
});

export default router;
