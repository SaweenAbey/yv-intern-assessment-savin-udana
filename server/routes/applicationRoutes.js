import express from 'express';
import { 
  getMembershipTypes, 
  submitApplication, 
  getMyApplication, 
  getApplications, 
  approveApplication, 
  rejectApplication,
  getDashboardCounts
} from '../controllers/applicationController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/membership-types', protect, getMembershipTypes);
router.get('/dashboard-counts', protect, checkPermission('application.view'), getDashboardCounts);
router.post('/', protect, submitApplication);
router.get('/my', protect, getMyApplication);
router.get('/', protect, checkPermission('application.view'), getApplications);
router.post('/:id/approve', protect, checkPermission('application.approve'), approveApplication);
router.post('/:id/reject', protect, checkPermission('application.reject'), rejectApplication);

export default router;

