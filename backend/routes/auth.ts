import { Router } from 'express';
import { upload } from '../config/cloudinaryConfig.js';
import { registerTutor, login, logout } from '../controllers/authController.js';

const router = Router();

// Streams registration files straight to Cloudinary instead of the local server disk
router.post('/register-tutor', upload.fields([
  { name: 'degree_certificate', maxCount: 1 },
  { name: 'cnic_document', maxCount: 1 },
  { name: 'profile_picture', maxCount: 1 }
]), registerTutor);

router.post('/login', login);
router.post('/logout', logout);

export default router;