import express from 'express';
import {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from '../controllers/meetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getMeetings)
  .post(createMeeting);

router.route('/:id')
  .get(getMeetingById)
  .put(updateMeeting)
  .patch(updateMeeting)
  .delete(deleteMeeting);

export default router;
