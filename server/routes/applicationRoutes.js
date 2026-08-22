import express from 'express';
import { 
  getMembershipTypes, 
  submitApplication, 
  getMyApplication, 
  getApplications, 
  approveApplication, 
  rejectApplication 
} from '../controllers/applicationController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/membership-types', protect, getMembershipTypes);
router.post('/', protect, submitApplication);
router.get('/my', protect, getMyApplication);
router.get('/', protect, checkPermission('VIEW_APPLICATIONS'), getApplications);
router.post('/:id/approve', protect, checkPermission('APPROVE_APPLICATION'), approveApplication);
router.post('/:id/reject', protect, checkPermission('REJECT_APPLICATION'), rejectApplication);

export default router;
