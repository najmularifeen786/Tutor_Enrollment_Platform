import { Request, Response } from 'express';
import { AuthRequest } from './middleware/authMiddleware.ts';
import {
  getTutorsService,
  getTutorByIdService,
  getTutorProfileService,
  updateTutorProfileService
} from './services/tutorService.ts';

export const getTutors = async (req: Request, res: Response) => {
  try {
    const subject = typeof req.query.subject === 'string' ? req.query.subject : undefined;
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const result = await getTutorsService(subject, city);

    res.json({
      success: true,
      data: result.tutors,
      total: result.total
    });
  } catch (error: any) {
    console.error('Get tutors error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tutors' });
  }
};

export const getTutorById = async (req: Request, res: Response) => {
  try {
    const tutor_id = parseInt(req.params.tutor_id, 10);
    if (Number.isNaN(tutor_id)) {
      return res.status(400).json({ success: false, message: 'Invalid tutor_id' });
    }

    const tutor = await getTutorByIdService(tutor_id);
    res.json({ success: true, data: tutor });
  } catch (error: any) {
    console.error('Get tutor by id error', error);
    if (error.message === 'Tutor not found') {
      return res.status(404).json({ success: false, message: 'Tutor not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch tutor' });
  }
};

export const getTutorProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.user_type !== 'tutor') {
      return res.status(403).json({ success: false, message: 'Only tutors can access this profile' });
    }

    const userId = req.user.user_id;
    const tutor = await getTutorProfileService(userId);

    res.json({ success: true, data: tutor });
  } catch (error: any) {
    console.error('Get profile error', error);
    if (error.message === 'Tutor not found') {
      return res.status(404).json({ success: false, message: 'Tutor not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

export const updateTutorProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.user_type !== 'tutor') {
      return res.status(403).json({ success: false, message: 'Only tutors can update their profile' });
    }

    const userId = req.user.user_id;
    const {
      name, phone, city, city_id, experience_years, latest_degree_title,
      qualification_id, subjects, hourly_rate_pkr, bio, teaching_institution_name,
      institution_type, teaching_mode, availability_schedule
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    await updateTutorProfileService({
      user_id: userId,
      name,
      phone,
      city,
      city_id,
      experience_years,
      latest_degree_title,
      qualification_id,
      subjects,
      hourly_rate_pkr,
      bio,
      teaching_institution_name,
      institution_type,
      teaching_mode,
      availability_schedule,
      files
    });

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Update profile error', error);
    const message = error.message || 'Failed to update profile';
    if (message.includes('Invalid') || message.includes('Please provide')) {
      return res.status(400).json({ success: false, message });
    }
    if (message === 'Tutor not found') {
      return res.status(404).json({ success: false, message });
    }
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};
