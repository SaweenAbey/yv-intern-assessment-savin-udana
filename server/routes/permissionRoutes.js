import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, (req, res) => {
  res.json([
    'member.view',
    'application.view',
    'application.approve',
    'application.reject',
    'role.manage',
    'audit.view'
  ]);
});

export default router;
