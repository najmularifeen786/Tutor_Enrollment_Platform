import path from 'path';
import { Request, Response } from 'express';
import { pool } from '../db/dbFunctions.js';
import sql from 'mssql';
import { AuthRequest } from '../middleware/authMiddleware.js';

const normalizeDocumentPath = (filePath: string) => filePath.replace(/^\/?uploads\/?/, '');
const getDocumentMetadata = (file: Express.Multer.File) => ({
  file_name: file.filename,
  document_title: file.originalname,
  file_size_kb: Math.round(file.size / 1024),
  file_extension: path.extname(file.originalname).replace(/^[.]/, '').toLowerCase()
});
const parseAvailabilitySchedule = (rawAvailability: any) => {
  const availability = String(rawAvailability || '').trim();
  if (!availability) return null;
  if (/^please\s*contact$/i.test(availability)) return null;

  const entries = availability.split(',').map((item) => item.trim()).filter(Boolean);
  if (entries.length === 0) return null;

  const schedule = [] as { day_of_week: string; notes: string }[];
  const scheduleRegex = /^(.+?)\s*:\s*(.+)$/;

  for (const entry of entries) {
    const match = entry.match(scheduleRegex);
    if (!match) {
      throw new Error('Availability schedule must use the format "Day or Range: time-range" separated by commas, or enter "please contact".');
    }
    const day_of_week = match[1].trim();
    const notes = match[2].trim();
    if (!day_of_week || !notes) {
      throw new Error('Availability schedule must include both a day and time range.');
    }
    schedule.push({ day_of_week, notes });
  }

  return schedule;
};

export const getTutors = async (req: Request, res: Response) => {
  try {
    const { subject, city } = req.query;
    
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connecting...' });
    }

    let query = `
      SELECT t.tutor_id,
             CONCAT(t.first_name, ' ', t.last_name) AS name,
             t.email,
             c.city_name AS city,
             t.years_of_experience AS experience_years,
             t.hourly_rate_pkr AS hourly_rate,
             t.bio,
             tm.mode_name AS teaching_mode,
             td.file_path AS profile_picture_path,
             t.is_active
      FROM Tutors t
      INNER JOIN Cities c ON t.city_id = c.city_id
      INNER JOIN TeachingModes tm ON t.teaching_mode_id = tm.teaching_mode_id
      LEFT JOIN (
        SELECT tutor_id, file_path FROM TutorDocuments WHERE document_type = 'ProfilePicture'
      ) td ON td.tutor_id = t.tutor_id
      WHERE t.is_active = 1
    `;
    const request = pool.request();

    if (subject) {
      // In MSSQL, we would query TutorSubjects directly, but since we are filtering the view
      // We can join with TutorSubjects or just filter using a subquery
      query += ` AND t.tutor_id IN (
         SELECT ts.tutor_id FROM TutorSubjects ts
         JOIN Subjects s ON ts.subject_id = s.subject_id
         WHERE s.subject_name LIKE '%' + @subject + '%'
      )`;
      request.input('subject', sql.NVarChar, subject);
    }
    
    if (city) {
      query += ` AND city_name LIKE '%' + @city + '%'`;
      request.input('city', sql.NVarChar, city);
    }

    query += '\n      ORDER BY t.created_at DESC';
    const tutorsResult = await request.query(query);
    const tutors = tutorsResult.recordset;

    // To add subjects effectively:
    for (const tutor of tutors) {
       const subRes = await pool.request()
         .input('tutor_id', sql.Int, tutor.tutor_id)
         .query(`
            SELECT s.subject_name 
            FROM TutorSubjects ts 
            JOIN Subjects s ON ts.subject_id = s.subject_id 
            WHERE ts.tutor_id = @tutor_id
         `);
       tutor.subjects = subRes.recordset.map(r => r.subject_name).join(', ');
    }

    res.json({
      success: true,
      data: tutors,
      total: tutors.length
    });
  } catch (error: any) {
    console.error('Get tutors error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tutors' });
  }
};

export const getTutorById = async (req: Request, res: Response) => {
  try {
    const { tutor_id } = req.params;
    
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    const request = pool.request();
    request.input('tutor_id', sql.Int, tutor_id);
    
    const tutorResult = await request.query(`
       SELECT t.*, c.city_name, c.city_id, q.qualification_name, q.qualification_id,
              it.type_name AS institution_type, tm.mode_name AS teaching_mode
       FROM Tutors t
       INNER JOIN Cities c ON t.city_id = c.city_id
       INNER JOIN Qualifications q ON t.highest_qualification_id = q.qualification_id
       INNER JOIN InstitutionTypes it ON t.institution_type_id = it.institution_type_id
       INNER JOIN TeachingModes tm ON t.teaching_mode_id = tm.teaching_mode_id
       WHERE t.tutor_id = @tutor_id
    `);
    
    const tutor = tutorResult.recordset[0];
    
    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor not found' });
    }

    // Remap some fields for frontend compatibility
    tutor.name = [tutor.first_name, tutor.last_name].filter(Boolean).join(' ').trim() || tutor.username || 'Tutor';
    tutor.hourly_rate = tutor.hourly_rate_pkr;
    tutor.experience_years = tutor.years_of_experience;
    tutor.latest_degree_title = tutor.qualification_name;
    tutor.city = tutor.city_name;
    
    const subRes = await pool.request()
      .input('tutor_id', sql.Int, tutor.tutor_id)
      .query(`
         SELECT s.subject_name 
         FROM TutorSubjects ts 
         JOIN Subjects s ON ts.subject_id = s.subject_id 
         WHERE ts.tutor_id = @tutor_id
      `);
    tutor.subjects = subRes.recordset.map(r => r.subject_name).join(', ');

    // For file paths, get from TutorDocuments (frontend assumes they are on tutor object directly)
    const docs = await pool.request()
      .input('tutor_id', sql.Int, tutor.tutor_id)
      .query(`SELECT document_type, file_path FROM TutorDocuments WHERE tutor_id = @tutor_id`);
      
    for (const doc of docs.recordset) {
      const normalizedPath = normalizeDocumentPath(doc.file_path || '');
      if (doc.document_type === 'ProfilePicture') tutor.profile_picture_path = normalizedPath;
      if (doc.document_type === 'DegreeCertificate') tutor.degree_certificate_path = normalizedPath;
      if (doc.document_type === 'CNIC') tutor.cnic_document_path = normalizedPath;
    }

    const availabilityRes = await pool.request()
      .input('tutor_id', sql.Int, tutor.tutor_id)
      .query(`SELECT notes FROM TutorAvailability WHERE tutor_id = @tutor_id AND is_available = 1`);
    tutor.availability_schedule = availabilityRes.recordset.map((r:any) => r.notes).join('; ');

    res.json({
      success: true,
      data: tutor
    });
  } catch (error: any) {
    console.error('Get tutor by id error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tutor' });
  }
};

export const getTutorProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    if (req.user?.user_type !== 'tutor') {
      return res.status(403).json({ success: false, message: 'Only tutors can access this profile' }); 
    }

    const request = pool.request();
    request.input('tutor_id', sql.Int, userId);
    
    const tutorResult = await request.query(`
       SELECT t.*, c.city_name, c.city_id, q.qualification_name, q.qualification_id,
              it.type_name AS institution_type, tm.mode_name AS teaching_mode
       FROM Tutors t
       INNER JOIN Cities c ON t.city_id = c.city_id
       INNER JOIN Qualifications q ON t.highest_qualification_id = q.qualification_id
       INNER JOIN InstitutionTypes it ON t.institution_type_id = it.institution_type_id
       INNER JOIN TeachingModes tm ON t.teaching_mode_id = tm.teaching_mode_id
       WHERE t.tutor_id = @tutor_id
    `);
    
    const tutor = tutorResult.recordset[0];

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor not found' });
    }

    tutor.name = `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim();
    tutor.hourly_rate = tutor.hourly_rate_pkr;
    tutor.experience_years = tutor.years_of_experience;
    tutor.latest_degree_title = tutor.qualification_name;
    tutor.city = tutor.city_name;

    const subRes = await pool.request()
      .input('tutor_id', sql.Int, tutor.tutor_id)
      .query(`
         SELECT s.subject_name 
         FROM TutorSubjects ts 
         JOIN Subjects s ON ts.subject_id = s.subject_id 
         WHERE ts.tutor_id = @tutor_id
      `);
    tutor.subjects = subRes.recordset.map(r => r.subject_name).join(', ');

    const docs = await pool.request()
      .input('tutor_id', sql.Int, tutor.tutor_id)
      .query(`SELECT document_type, file_path FROM TutorDocuments WHERE tutor_id = @tutor_id`);
      
    for (const doc of docs.recordset) {
      const normalizedPath = normalizeDocumentPath(doc.file_path || '');
      if (doc.document_type === 'ProfilePicture') tutor.profile_picture_path = normalizedPath;
      if (doc.document_type === 'DegreeCertificate') tutor.degree_certificate_path = normalizedPath;
      if (doc.document_type === 'CNIC') tutor.cnic_document_path = normalizedPath;
    }

    const availabilityRes = await pool.request()
      .input('tutor_id', sql.Int, tutor.tutor_id)
      .query(`SELECT notes FROM TutorAvailability WHERE tutor_id = @tutor_id AND is_available = 1`);
    tutor.availability_schedule = availabilityRes.recordset.map((r:any) => r.notes).join('; ');

    res.json({
      success: true,
      data: tutor
    });
  } catch (error) {
    console.error('Get profile error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

export const updateTutorProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    if (req.user?.user_type !== 'tutor') {
      return res.status(403).json({ success: false, message: 'Only tutors can update their profile' });
    }

    const {
        name, phone, city, city_id, experience_years, latest_degree_title,
        qualification_id, subjects, hourly_rate, bio, teaching_institution,
        institution_type, teaching_mode, availability_schedule
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const nameParts = name ? name.split(' ') : [''];
    const first_name = nameParts[0] || '';
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const selectedCityId = city_id ? parseInt(String(city_id), 10) : NaN;
    let city_id_value = !isNaN(selectedCityId) && selectedCityId > 0 ? selectedCityId : undefined;

    if (!city_id_value && city) {
      const cityResult = await pool.request().input('city_name', sql.NVarChar, city).query('SELECT city_id FROM Cities WHERE city_name = @city_name');
      city_id_value = cityResult.recordset[0]?.city_id;
    }

    if (!city_id_value) {
      city_id_value = 1;
    }

    const selectedQualificationId = qualification_id ? parseInt(String(qualification_id), 10) : NaN;
    let qual_id = !isNaN(selectedQualificationId) && selectedQualificationId > 0 ? selectedQualificationId : undefined;

    if (!qual_id && latest_degree_title) {
      const qualResult = await pool.request().input('qual_name', sql.NVarChar, latest_degree_title).query('SELECT qualification_id FROM Qualifications WHERE qualification_name = @qual_name');
      qual_id = qualResult.recordset[0]?.qualification_id;
    }

    if (!qual_id) {
      qual_id = 1;
    }

    const modeResult = await pool.request().input('mode_name', sql.NVarChar, teaching_mode).query('SELECT teaching_mode_id FROM TeachingModes WHERE mode_name = @mode_name');
    let mode_id = modeResult.recordset[0]?.teaching_mode_id || 1;

    await pool.request()
      .input('first_name', sql.NVarChar, first_name)
      .input('last_name', sql.NVarChar, last_name)
      .input('phone', sql.NVarChar, phone)
      .input('city_id', sql.Int, city_id_value)
      .input('highest_qualification_id', sql.Int, qual_id)
      .input('teaching_mode_id', sql.Int, mode_id)
      .input('years_of_experience', sql.Int, experience_years)
      .input('hourly_rate_pkr', sql.Decimal(10,2), hourly_rate)
      .input('bio', sql.NVarChar(sql.MAX), bio)
      .input('teaching_institution_name', sql.NVarChar, teaching_institution)
      .input('tutor_id', sql.Int, userId)
      .query(`
        UPDATE Tutors SET
          first_name = @first_name,
          last_name = @last_name,
          phone = @phone,
          city_id = @city_id,
          highest_qualification_id = @highest_qualification_id,
          teaching_mode_id = @teaching_mode_id,
          years_of_experience = @years_of_experience,
          hourly_rate_pkr = @hourly_rate_pkr,
          bio = @bio,
          teaching_institution_name = @teaching_institution_name,
          updated_at = GETDATE()
        WHERE tutor_id = @tutor_id
      `);

    // Handle files via TutorDocuments
    if (files) {
        const documentMappings = [
          { field: 'profile_picture', type: 'ProfilePicture' },
          { field: 'degree_certificate', type: 'DegreeCertificate' },
          { field: 'cnic_document', type: 'CNIC' }
        ];

        for (const document of documentMappings) {
          const file = files[document.field]?.[0];
          if (!file) continue;

          const metadata = getDocumentMetadata(file);
          const normalizedPath = normalizeDocumentPath(metadata.file_name);

          await pool.request().input('tutor_id', sql.Int, userId).query(`DELETE FROM TutorDocuments WHERE tutor_id = @tutor_id AND document_type = '${document.type}'`);
          await pool.request()
            .input('tutor_id', sql.Int, userId)
            .input('document_type', sql.NVarChar, document.type)
            .input('document_title', sql.NVarChar, metadata.document_title)
            .input('file_path', sql.NVarChar, normalizedPath)
            .input('file_size_kb', sql.Int, metadata.file_size_kb)
            .input('file_extension', sql.NVarChar, metadata.file_extension)
            .query(`INSERT INTO TutorDocuments (tutor_id, document_type, document_title, file_path, file_size_kb, file_extension)
                   VALUES (@tutor_id, @document_type, @document_title, @file_path, @file_size_kb, @file_extension)`);
        }
    }

    let parsedAvailability = null;
    try {
      parsedAvailability = parseAvailabilitySchedule(availability_schedule);
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Invalid availability schedule format' });
    }

    await pool.request().input('tutor_id', sql.Int, userId).query(`DELETE FROM TutorAvailability WHERE tutor_id = @tutor_id`);
    if (parsedAvailability) {
      for (const entry of parsedAvailability) {
        await pool.request()
          .input('tutor_id', sql.Int, userId)
          .input('day_of_week', sql.NVarChar, entry.day_of_week)
          .input('notes', sql.NVarChar(255), entry.notes)
          .query(`INSERT INTO TutorAvailability (tutor_id, day_of_week, notes) VALUES (@tutor_id, @day_of_week, @notes)`);
      }
    }

    if (subjects && typeof subjects === 'string') {
        const subArray = subjects.split(',').map(s => s.trim());
        await pool.request().input('tutor_id', sql.Int, userId).query(`DELETE FROM TutorSubjects WHERE tutor_id = @tutor_id`);
        for (const sub of subArray) {
            const subRes = await pool.request()
                .input('subject_name', sql.NVarChar, sub)
                .query('SELECT subject_id FROM Subjects WHERE subject_name = @subject_name');
            let sub_id = subRes.recordset[0]?.subject_id;
            if (!sub_id) {
               const newSub = await pool.request()
                 .input('subject_name', sql.NVarChar, sub)
                 .query('INSERT INTO Subjects (subject_name, category) OUTPUT INSERTED.subject_id VALUES (@subject_name, \'General\')');
               sub_id = newSub.recordset[0].subject_id;
            }
            await pool.request()
              .input('tutor_id', sql.Int, userId)
              .input('subject_id', sql.Int, sub_id)
              .query('INSERT INTO TutorSubjects (tutor_id, subject_id, expertise_level) VALUES (@tutor_id, @subject_id, \'Intermediate\')');
        }
    }


    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    console.error('Update profile error', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

