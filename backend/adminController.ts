import { Request, Response } from 'express';
import {
  getAllTutorsService,
  getTutorDetailedService,
  activateTutorService,
  deactivateTutorService,
  getStatisticsService
} from './services/adminService.ts';

export const getAllTutors = async (req: Request, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const { tutors, total } = await getAllTutorsService(status);

    res.json({
      success: true,
      data: tutors,
      total
    });
  } catch (error) {
    console.error('Get all tutors error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tutors' });
  }
};

export const getTutorDetailed = async (req: Request, res: Response) => {
  try {
    const tutor_id = parseInt(req.params.tutor_id, 10);
    if (Number.isNaN(tutor_id)) {
      return res.status(400).json({ success: false, message: 'Invalid tutor_id' });
    }

    const tutor = await getTutorDetailedService(tutor_id);
    res.json({ success: true, data: tutor });
  } catch (error: any) {
    console.error('Get detailed tutor error', error);
    if (error.message === 'Tutor not found') {
      return res.status(404).json({ success: false, message: 'Tutor not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch tutor details' });
  }
};

export const activateTutor = async (req: Request, res: Response) => {
  try {
    const tutor_id = parseInt(req.params.tutor_id, 10);
    if (Number.isNaN(tutor_id)) {
      return res.status(400).json({ success: false, message: 'Invalid tutor_id' });
    }

    await activateTutorService(tutor_id);
    res.json({ success: true, message: 'Tutor activated successfully' });
  } catch (error) {
    console.error('Activate tutor error', error);
    res.status(500).json({ success: false, message: 'Failed to activate tutor' });
  }
};

export const deactivateTutor = async (req: Request, res: Response) => {
  try {
    const tutor_id = parseInt(req.params.tutor_id, 10);
    if (Number.isNaN(tutor_id)) {
      return res.status(400).json({ success: false, message: 'Invalid tutor_id' });
    }

    await deactivateTutorService(tutor_id);
    res.json({ success: true, message: 'Tutor deactivated successfully' });
  } catch (error) {
    console.error('Deactivate tutor error', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate tutor' });
  }
};

export const getStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await getStatisticsService();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get statistics error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
