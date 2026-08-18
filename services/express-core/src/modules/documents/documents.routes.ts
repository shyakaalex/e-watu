import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  generateUploadPresignedUrl,
  generateDownloadPresignedUrl,
  renderDocumentTemplate
} from './documents.service';

const router = Router();

// Apply authorization and tenant context middleware
router.use(authMiddleware);

/**
 * POST /api/v1/documents/presign-upload
 * Requests a presigned URL to upload a file directly to the tenant's folder.
 */
router.post('/presign-upload', async (req: Request, res: Response) => {
  const { fileName, contentType } = req.body;

  if (!fileName || !contentType) {
    return res.status(400).json({ error: 'Missing required parameters: fileName, contentType' });
  }

  try {
    const result = await generateUploadPresignedUrl(req.tenantId!, fileName, contentType);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error generating upload presigned URL:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/documents/presign-download
 * Requests a presigned URL to view/download a file securely.
 */
router.post('/presign-download', async (req: Request, res: Response) => {
  const { fileKey } = req.body;

  if (!fileKey) {
    return res.status(400).json({ error: 'Missing required parameter: fileKey' });
  }

  try {
    const downloadUrl = await generateDownloadPresignedUrl(req.tenantId!, fileKey);
    return res.status(200).json({ downloadUrl });
  } catch (error: any) {
    console.error('Error generating download presigned URL:', error);
    // Return forbidden/bad request if boundary validation check fails
    const status = error.message.includes('Access Denied') ? 403 : 500;
    return res.status(status).json({ error: error.message });
  }
});

/**
 * POST /api/v1/documents/render-template
 * Merges employee/offer parameters into custom contract templates.
 */
router.post('/render-template', (req: Request, res: Response) => {
  const { templateText, mergeFields } = req.body;

  if (templateText === undefined || !mergeFields) {
    return res.status(400).json({ error: 'Missing required parameters: templateText, mergeFields' });
  }

  try {
    const renderedText = renderDocumentTemplate(templateText, mergeFields);
    return res.status(200).json({ renderedText });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
