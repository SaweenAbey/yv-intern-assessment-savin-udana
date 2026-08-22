import express from 'express';
import { getMembers } from '../controllers/memberController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, checkPermission('VIEW_MEMBERS'), getMembers);

export default router;
