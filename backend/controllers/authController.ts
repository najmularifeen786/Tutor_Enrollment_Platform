import { Request, Response } from 'express';
import { loginService, registerTutorService } from '../services/authService.js';

export const registerTutor = async (req: Request, res: Response) => {
  try {
    const {
      username, password, name, phone, email,
      city_id, city, qualification_id, latest_degree_title,
      experience_years, cnic_number, subjects, hourly_rate_pkr,
      bio, teaching_institution_name, institution_type, teaching_mode,
      availability_schedule
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const result = await registerTutorService({
      username,
      password,
      name,
      phone,
      email,
      city_id,
      city,
      qualification_id,
      latest_degree_title,
      experience_years,
      cnic_number,
      subjects,
      hourly_rate_pkr,
      bio,
      teaching_institution_name,
      institution_type,
      teaching_mode,
      availability_schedule,
      files
    });

    res.json({
      success: true,
      message: 'Tutor registered successfully',
      tutor_id: result.tutor_id
    });
  } catch (error: any) {
    console.error('Registration error', error);
    const message = error.message || 'Registration failed';
    if (message.includes('Please provide') || message.includes('Invalid') || message.includes('Failed to create tutor record')) {
      return res.status(400).json({ success: false, message });
    }
    return res.status(500).json({ success: false, message: 'Registration failed', error: message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, user_type } = req.body;
    const result = await loginService(username, password, user_type);

    res.json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user_type: result.user_type,
      user_id: result.user_id
    });
  } catch (error: any) {
    console.error('Login error', error);
    const message = error.message || 'Login failed';
    if (message === 'Invalid credentials') {
      return res.status(401).json({ success: false, message });
    }
    if (message === 'Invalid user_type') {
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

