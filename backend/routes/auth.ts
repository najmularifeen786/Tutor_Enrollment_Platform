import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { registerTutor, login, logout } from '../controllers/authController.js';

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

router.post('/register-tutor', upload.fields([
  { name: 'degree_certificate', maxCount: 1 },
  { name: 'cnic_document', maxCount: 1 },
  { name: 'profile_picture', maxCount: 1 }
]), registerTutor);

router.post('/login', login);
router.post('/logout', logout);

export default router;
