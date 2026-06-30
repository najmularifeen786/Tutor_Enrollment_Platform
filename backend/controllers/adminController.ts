import { Request, Response } from 'express';
import { pool } from '../db/dbFunctions.js'; // Ensure this matches your path configuration

export const getAllTutors = async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    const status = typeof req.query.status === 'string' ? req.query.status : undefined; // 'all', 'active', or 'inactive'

    let query = `SELECT t.tutor_id,
                        CONCAT(t.first_name, ' ', t.last_name) AS name,
                        t.email,
                        t.is_active,
                        t.created_at
                 FROM Tutors t`;

    if (status === 'active') {
      query += ' WHERE t.is_active = TRUE';
    } else if (status === 'inactive') {
      query += ' WHERE t.is_active = FALSE';
    }

    query += ' ORDER BY t.created_at DESC';

    const tutorsResult = await pool.query(query);
    const tutors = tutorsResult.rows;

    // Load all subject names for returned tutors in one query
    const tutorIds = tutors.map((t: any) => t.tutor_id);
    let subjectMap: Record<number, string[]> = {};

    if (tutorIds.length > 0) {
      const placeholderNames = tutorIds.map((_, idx) => `$${idx + 1}`);

      const subjectsResult = await pool.query(`
          SELECT ts.tutor_id, s.subject_name
          FROM TutorSubjects ts
          JOIN Subjects s ON ts.subject_id = s.subject_id
          WHERE ts.tutor_id IN (${placeholderNames.join(',')})
        `, tutorIds);

      subjectMap = subjectsResult.rows.reduce((map: Record<number, string[]>, row: any) => {
        const id = row.tutor_id;
        if (!map[id]) map[id] = [];
        map[id].push(row.subject_name);
        return map;
      }, {} as Record<number, string[]>);
    }

    for (const tutor of tutors) {
      tutor.subjects = (subjectMap[tutor.tutor_id] || []).join(', ') || 'No subjects';
    }

    res.json({
      success: true,
      data: tutors,
      total: tutors.length
    });
  } catch (error) {
    console.error('Get all tutors error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tutors' });
  }
};

export const getTutorDetailed = async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    const tutor_id = parseInt(req.params.tutor_id, 10);
    if (Number.isNaN(tutor_id)) {
      return res.status(400).json({ success: false, message: 'Invalid tutor_id' });
    }

    const tutorResult = await pool.query(`
        SELECT t.tutor_id,
               CONCAT(t.first_name, ' ', t.last_name) AS full_name,
               t.email,
               t.phone,
               t.city_id,
               c.city_name,
               t.highest_qualification_id,
               q.qualification_name,
               t.years_of_experience,
               t.hourly_rate_pkr AS hourly_rate_pkr,
               t.bio,
               t.teaching_institution_name,
               it.type_name AS institution_type,
               tm.mode_name AS teaching_mode,
               t.cnic_number,
               t.username,
               t.is_active,
               t.created_at
        FROM Tutors t
        LEFT JOIN Cities c ON t.city_id = c.city_id
        LEFT JOIN Qualifications q ON t.highest_qualification_id = q.qualification_id
        LEFT JOIN InstitutionTypes it ON t.institution_type_id = it.institution_type_id
        LEFT JOIN TeachingModes tm ON t.teaching_mode_id = tm.teaching_mode_id
        WHERE t.tutor_id = $1
      `, [tutor_id]);

    if (!tutorResult.rows || tutorResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tutor not found' });
    }

    const tutor = tutorResult.rows[0];

    const subjectsResult = await pool.query(`
        SELECT s.subject_name
        FROM TutorSubjects ts
        JOIN Subjects s ON ts.subject_id = s.subject_id
        WHERE ts.tutor_id = $1
      `, [tutor_id]);

    const availabilityResult = await pool.query(`
        SELECT day_of_week, start_time, end_time
        FROM TutorAvailability
        WHERE tutor_id = $1
        ORDER BY day_of_week
      `, [tutor_id]);

    const subjects = subjectsResult.rows || [];
    const availability = availabilityResult.rows || [];

    // Map fields for frontend compatibility
    tutor.name = tutor.full_name;
    tutor.hourly_rate_pkr = tutor.hourly_rate_pkr;
    tutor.experience_years = tutor.years_of_experience;
    tutor.latest_degree_title = tutor.qualification_name;
    tutor.city = tutor.city_name;
    tutor.subjects = subjects.map((s: any) => s.subject_name).join(', ') || 'No subjects';
    tutor.availability_schedule = availability.map((a: any) => `${a.day_of_week}: ${a.start_time}-${a.end_time}`).join('; ') || 'No availability set';
    
    // Get documents
    const docsResult = await pool.query(
      `SELECT document_type, file_path FROM TutorDocuments WHERE tutor_id = $1`,
      [tutor.tutor_id]
    );
      
    for (const doc of docsResult.rows) {
      if (doc.document_type === 'ProfilePicture') tutor.profile_picture_path = doc.file_path;
      if (doc.document_type === 'DegreeCertificate') tutor.degree_certificate_path = doc.file_path;
      if (doc.document_type === 'CNIC') tutor.cnic_document_path = doc.file_path;
    }

    res.json({
      success: true,
      data: tutor
    });
  } catch (error: any) {
    console.error('Get detailed tutor error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tutor details' });
  }
};

export const activateTutor = async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    const tutor_id = parseInt(req.params.tutor_id, 10);
    if (Number.isNaN(tutor_id)) {
      return res.status(400).json({ success: false, message: 'Invalid tutor_id' });
    }

    await pool.query('UPDATE Tutors SET is_active = TRUE WHERE tutor_id = $1', [tutor_id]);
    res.json({ success: true, message: 'Tutor activated successfully' });
  } catch (error) {
    console.error('Activate tutor error', error);
    res.status(500).json({ success: false, message: 'Failed to activate tutor' });
  }
};

export const deactivateTutor = async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    const tutor_id = parseInt(req.params.tutor_id, 10);
    if (Number.isNaN(tutor_id)) {
      return res.status(400).json({ success: false, message: 'Invalid tutor_id' });
    }

    await pool.query('UPDATE Tutors SET is_active = FALSE WHERE tutor_id = $1', [tutor_id]);
    res.json({ success: true, message: 'Tutor deactivated successfully' });
  } catch (error) {
    console.error('Deactivate tutor error', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate tutor' });
  }
};

export const getStatistics = async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    const statsResult = await pool.query(`
      SELECT
        COUNT(*) AS total_tutors,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) AS active_tutors,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) AS inactive_tutors,
        SUM(CASE WHEN created_at::date = CURRENT_DATE THEN 1 ELSE 0 END) AS new_tutors_today,
        COUNT(DISTINCT city_id) AS num_cities,
        AVG(hourly_rate_pkr::numeric(10,2)) AS avg_hourly_rate_pkr
      FROM Tutors
    `);
    const stats = statsResult.rows[0] || {};
    
    const subjectsCountRes = await pool.query('SELECT COUNT(*) as count FROM Subjects');

    res.json({
      success: true,
      data: {
        total_tutors: stats.total_tutors,
        active_tutors: stats.active_tutors,
        inactive_tutors: stats.inactive_tutors,
        new_tutors_today: stats.new_tutors_today,
        total_registrations_today: stats.new_tutors_today,
        num_cities: stats.num_cities,
        avg_hourly_rate_pkr: stats.avg_hourly_rate_pkr,
        subjects_count: subjectsCountRes.rows[0].count
      }
    });
  } catch (error) {
    console.error('Get statistics error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};