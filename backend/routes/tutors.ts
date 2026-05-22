import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTutors, getTutorById, getTutorProfile, updateTutorProfile } from '../controllers/tutorController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

const router = Router();

router.get('/', getTutors);
router.get('/profile', authMiddleware, getTutorProfile);
router.get('/:tutor_id', getTutorById);
router.put('/profile', authMiddleware, upload.fields([
  { name: 'degree_certificate', maxCount: 1 },
  { name: 'cnic_document', maxCount: 1 },
  { name: 'profile_picture', maxCount: 1 }
]), updateTutorProfile);

export default router;
