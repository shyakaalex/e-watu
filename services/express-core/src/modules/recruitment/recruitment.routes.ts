import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  createJobOrder,
  getJobOrders,
  getJobOrder,
  updateJobOrder,
  deleteJobOrder,
  createApplication,
  getApplications,
  getApplication,
  updateApplicationStage
} from './recruitment.service';

const router = Router();

// Secure all endpoints with auth & tenant context isolation middleware
router.use(authMiddleware);

/**
 * Job Orders CRUD Endpoints
 */
router.post('/jobs', async (req: Request, res: Response) => {
  const { clientId, title, description, feePercentage } = req.body;
  if (!clientId || !title) {
    return res.status(400).json({ error: 'Missing required parameters: clientId, title' });
  }
  try {
    const job = await createJobOrder(req.tenantId!, { clientId, title, description, feePercentage });
    return res.status(201).json(job);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const jobs = await getJobOrders(req.tenantId!);
    return res.status(200).json(jobs);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const job = await getJobOrder(req.tenantId!, req.params.id);
    return res.status(200).json(job);
  } catch (error: any) {
    return res.status(404).json({ error: error.message });
  }
});

router.put('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const job = await updateJobOrder(req.tenantId!, req.params.id, req.body);
    return res.status(200).json(job);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/jobs/:id', async (req: Request, res: Response) => {
  try {
    await deleteJobOrder(req.tenantId!, req.params.id);
    return res.status(200).json({ message: 'Job order deleted successfully' });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

/**
 * Applications CRUD Endpoints
 */
router.post('/applications', async (req: Request, res: Response) => {
  const { jobOrderId, candidateId, notes } = req.body;
  if (!jobOrderId || !candidateId) {
    return res.status(400).json({ error: 'Missing required parameters: jobOrderId, candidateId' });
  }
  try {
    const app = await createApplication(req.tenantId!, { jobOrderId, candidateId, notes });
    return res.status(201).json(app);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/applications', async (req: Request, res: Response) => {
  const { jobOrderId, candidateId } = req.query;
  try {
    const apps = await getApplications(req.tenantId!, {
      jobOrderId: jobOrderId as string,
      candidateId: candidateId as string
    });
    return res.status(200).json(apps);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/applications/:id', async (req: Request, res: Response) => {
  try {
    const app = await getApplication(req.tenantId!, req.params.id);
    return res.status(200).json(app);
  } catch (error: any) {
    return res.status(404).json({ error: error.message });
  }
});

/**
 * Pipeline Stage Transition Endpoint
 */
router.put('/applications/:id/stage', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stage, basicSalary, notes } = req.body;

  if (!stage) {
    return res.status(400).json({ error: 'Missing required parameter: stage' });
  }

  try {
    const result = await updateApplicationStage(
      req.tenantId!,
      id,
      stage,
      req.user!.sub,
      { basicSalary: basicSalary ? Number(basicSalary) : undefined, notes }
    );
    return res.status(200).json({ message: `Application stage updated to ${stage}`, ...result });
  } catch (error: any) {
    console.error('Error updating application stage:', error);
    return res.status(400).json({ error: error.message });
  }
});

export default router;
