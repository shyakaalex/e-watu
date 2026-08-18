import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Client Portal module placeholder' });
});

export default router;
