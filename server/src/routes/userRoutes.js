import express from 'express';
import { getAllUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllUsers);

export default router;
