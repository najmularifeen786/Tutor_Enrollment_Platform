import { Router } from 'express';
import { upload } from '../config/cloudinaryConfig.js';
import { getTutors, getTutorById, getTutorProfile, updateTutorProfile } from '../controllers/tutorController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getTutors);
router.get('/profile', authMiddleware, getTutorProfile);
router.get('/:tutor_id', getTutorById);

// This cleanly intercepts the fields and streams them straight to Cloudinary
router.put('/profile', authMiddleware, upload.fields([
  { name: 'degree_certificate', maxCount: 1 },
  { name: 'cnic_document', maxCount: 1 },
  { name: 'profile_picture', maxCount: 1 }
]), updateTutorProfile);

export default router;