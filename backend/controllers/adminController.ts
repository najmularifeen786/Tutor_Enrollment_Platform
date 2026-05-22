import { Request, Response } from 'express';
import { pool } from '../db/dbFunctions.js';
import sql from 'mssql';

export const getAllTutors = async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    const { status } = req.query; // 'all', 'active', or 'inactive'
    const request = pool.request();

    let query = `SELECT t.tutor_id,
                        CONCAT(t.first_name, ' ', t.last_name) AS name,
                        t.email,
                        t.is_active,
                        t.created_at
                 FROM Tutors t`;

    if (status === 'active') {
      query += ' WHERE t.is_active = 1';
    } else if (status === 'inactive') {
      query += ' WHERE t.is_active = 0';
    }

    query += ' ORDER BY t.created_at DESC';

    const tutorsResult = await request.query(query);
    const tutors = tutorsResult.recordset;

    // Load all subject names for returned tutors in one query
    const tutorIds = tutors.map((t: any) => t.tutor_id);
    let subjectMap: Record<number, string[]> = {};

    if (tutorIds.length > 0) {
      const subjectRequest = pool.request();
      const paramNames = tutorIds.map((id: number, idx: number) => {
        const paramName = `id${idx}`;
        subjectRequest.input(paramName, sql.Int, id);
        return `@${paramName}`;
      });

      const subjectsResult = await subjectRequest.query(`
          SELECT ts.tutor_id, s.subject_name
          FROM TutorSubjects ts
          JOIN Subjects s ON ts.subject_id = s.subject_id
          WHERE ts.tutor_id IN (${paramNames.join(',')})
        `);

      subjectMap = subjectsResult.recordset.reduce((map: Record<number, string[]>, row: any) => {
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

    const { tutor_id } = req.params;
    const request = pool.request();
    request.input('tutor_id', sql.Int, tutor_id);
    
    // Use SP_GetTutorProfile stored procedure for comprehensive tutor data
    const profileResult = await request.execute('SP_GetTutorProfile');
    const recordsets = Array.isArray(profileResult.recordsets)
      ? profileResult.recordsets
      : Object.values(profileResult.recordsets);

    if (!recordsets || recordsets.length === 0 || !recordsets[0]?.[0]) {
      return res.status(404).json({ success: false, message: 'Tutor not found' });
    }

    const tutor = recordsets[0][0]; // First result set is tutor details
    const subjects = recordsets[1] || []; // Second result set is subjects
    const availability = recordsets[2] || []; // Third result set is availability

    // Map fields for frontend compatibility
    tutor.name = tutor.full_name;
    tutor.hourly_rate = tutor.hourly_rate_pkr;
    tutor.experience_years = tutor.years_of_experience;
    tutor.latest_degree_title = tutor.qualification_name;
    tutor.city = tutor.city_name;
    tutor.subjects = subjects.map((s: any) => s.subject_name).join(', ') || 'No subjects';
    tutor.availability_schedule = availability.map((a: any) => `${a.day_of_week}: ${a.start_time}-${a.end_time}`).join('; ') || 'No availability set';
    
    // Get documents
    const docs = await pool.request()
      .input('tutor_id', sql.Int, tutor.tutor_id)
      .query(`SELECT document_type, file_path FROM TutorDocuments WHERE tutor_id = @tutor_id`);
      
    for (const doc of docs.recordset) {
      if (doc.document_type === 'ProfilePicture') tutor.profile_picture_path = doc.file_path;
      if (doc.document_type === 'DegreeCertificate') tutor.degree_certificate_path = doc.file_path;
      if (doc.document_type === 'CNIC') tutor.cnic_document_path = doc.file_path;
    }

    res.json({
      success: true,
      data: tutor
    });
  } catch (error) {
    console.error('Get detailed tutor error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tutor details' });
  }
};

export const activateTutor = async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    const { tutor_id } = req.params;
    
    // Use SP_ActivateTutor stored procedure
    await pool.request()
        .input('tutorId', sql.Int, tutor_id)
        .execute('SP_ActivateTutor');
    
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

    const { tutor_id } = req.params;
    
    // Use SP_DeactivateTutor stored procedure
    await pool.request()
        .input('tutorId', sql.Int, tutor_id)
        .execute('SP_DeactivateTutor');
    
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

    // Use SP_GetDashboardStatistics stored procedure
    const statsResult = await pool.request().execute('SP_GetDashboardStatistics');
    const stats = statsResult.recordset[0];
    
    const subjectsCountRes = await pool.request().query('SELECT COUNT(*) as count FROM Subjects');

    res.json({
      success: true,
      data: {
        total_tutors: stats.total_tutors,
        active_tutors: stats.active_tutors,
        inactive_tutors: stats.inactive_tutors,
        new_tutors_today: stats.new_tutors_today,
        num_cities: stats.num_cities,
        avg_hourly_rate: stats.avg_hourly_rate,
        subjects_count: subjectsCountRes.recordset[0].count
      }
    });

  } catch (error) {
    console.error('Get statistics error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};

