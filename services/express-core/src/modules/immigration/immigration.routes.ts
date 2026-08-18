import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  createPermitCase,
  getPermitCases,
  getPermitCaseDetails,
  updateChecklistItem,
  scanAndAlertPermitExpiries
} from './immigration.service';

const router = Router();

// Apply auth & tenant isolation
router.use(authMiddleware);

/**
 * POST /api/v1/immigration/cases
 * Start a new visa/work permit case and generate dynamic document checklist.
 */
router.post('/cases', async (req: Request, res: Response) => {
  const { employeeId, permitNumber, permitType, country, expiryDate } = req.body;

  if (!employeeId || !permitNumber || !permitType || !expiryDate) {
    return res.status(400).json({ error: 'Missing required parameters: employeeId, permitNumber, permitType, expiryDate' });
  }

  try {
    const result = await createPermitCase(req.tenantId!, {
      employeeId,
      permitNumber,
      permitType,
      country,
      expiryDate
    });
    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Error starting permit case:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/v1/immigration/cases
 * List all immigration cases for the current tenant.
 */
router.get('/cases', async (req: Request, res: Response) => {
  try {
    const cases = await getPermitCases(req.tenantId!);
    return res.status(200).json(cases);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/v1/immigration/cases/:id
 * Retrieve detailed status of a case and checklist documents.
 */
router.get('/cases/:id', async (req: Request, res: Response) => {
  try {
    const details = await getPermitCaseDetails(req.tenantId!, req.params.id);
    return res.status(200).json(details);
  } catch (error: any) {
    return res.status(404).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/immigration/cases/:id/items/:itemId
 * Update checklist item (e.g. status UPLOADED or VERIFIED, and link the fileKey).
 */
router.put('/cases/:id/items/:itemId', async (req: Request, res: Response) => {
  const { id, itemId } = req.params;
  const { status, fileKey } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Missing required parameter: status' });
  }

  try {
    const item = await updateChecklistItem(req.tenantId!, id, itemId, status, fileKey);
    return res.status(200).json(item);
  } catch (error: any) {
    console.error('Error updating checklist item:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/immigration/alerts/trigger
 * Administrative route to manually trigger immigration alerts check (helps in tests).
 */
router.post('/alerts/trigger', async (req: Request, res: Response) => {
  try {
    const alertCount = await scanAndAlertPermitExpiries();
    return res.status(200).json({ message: 'Expiry scan run successfully.', alertsTriggered: alertCount });
  } catch (error: any) {
    console.error('Error executing expiry alerts check:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
