import { Router } from 'express';
import { getAllTutors, getTutorDetailed, activateTutor, deactivateTutor, getStatistics } from '../controllers/adminController.js';
import { adminAuthMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All routes here should require admin authentication
router.use(adminAuthMiddleware);

router.get('/tutors', getAllTutors);
router.get('/tutor/:tutor_id', getTutorDetailed);
router.put('/tutor/:tutor_id/activate', activateTutor);
router.put('/tutor/:tutor_id/deactivate', deactivateTutor);
router.get('/statistics', getStatistics);

export default router;
