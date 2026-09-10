import express from 'express';
import {
  getAllProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  joinProject
} from '../controllers/projectController.js';
import {
  getProjectMembers,
  addProjectMember,
  removeProjectMember
} from '../controllers/memberController.js';
import {
  getProjectTasks,
  createTask
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateProject, validateTask } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All project routes require authentication
router.use(protect);

router.route('/')
  .get(getAllProjects)
  .post(validateProject, createProject);

router.route('/:id')
  .get(getProjectById)
  .put(validateProject, updateProject)
  .delete(deleteProject);

// Self-join project from invite link
router.post('/:id/join', joinProject);

// Nested Member Routes (Requirement 41)
router.route('/:id/members')
  .get(getProjectMembers)
  .post(addProjectMember);

router.route('/:id/members/:userId')
  .delete(removeProjectMember);

// Nested Task Routes (Requirement 41)
router.route('/:id/tasks')
  .get(getProjectTasks)
  .post(validateTask, createTask);

export default router;
