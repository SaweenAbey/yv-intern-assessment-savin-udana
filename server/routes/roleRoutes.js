import express from 'express';
import { 
  createRole, 
  updateRole, 
  getRoles, 
  assignRole, 
  createOfficer, 
  getOfficers
} from '../controllers/roleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('CHAIRMAN'));

router.post('/', createRole);
router.put('/:id/permissions', updateRole);
router.get('/', getRoles);
router.post('/:id/assign', assignRole);
router.post('/officers', createOfficer);
router.get('/officers', getOfficers);

export default router;
