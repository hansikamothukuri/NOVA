import express from 'express';
import { getTaskById, updateTask, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .patch(updateTask)
  .delete(deleteTask);

export default router;
