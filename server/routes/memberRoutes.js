import express from 'express';
import { getMembers, exportMembersCSV } from '../controllers/memberController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/export', protect, checkPermission('member.view'), exportMembersCSV);
router.get('/', protect, checkPermission('member.view'), getMembers);

export default router;

