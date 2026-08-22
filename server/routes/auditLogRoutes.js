import express from 'express';
import { getAuditLogs } from '../controllers/roleController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, checkPermission('audit.view'), getAuditLogs);

export default router;
