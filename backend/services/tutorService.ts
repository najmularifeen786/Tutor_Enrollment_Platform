import path from 'path';
import pool from '../config/db.js';
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

export async function getTutorsService(subject?: string, city?: string) {
  if (!pool) throw new Error('Database not connected.');

  let query = `
      SELECT t.tutor_id,
             CONCAT(t.first_name, ' ', t.last_name) AS name,
             t.email,
             c.city_name AS city,
             t.years_of_experience AS experience_years,
             t.hourly_rate_pkr AS hourly_rate_pkr,
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
      WHERE t.is_active = TRUE
    `;

  const values: any[] = [];

  if (subject) {
    query += ` AND t.tutor_id IN (
         SELECT ts.tutor_id FROM TutorSubjects ts
         JOIN Subjects s ON ts.subject_id = s.subject_id
         WHERE s.subject_name LIKE '%' || $${values.length + 1} || '%'
      )`;
    values.push(subject);
  }

  if (city) {
    query += ` AND city_name LIKE '%' || $${values.length + 1} || '%'`;
    values.push(city);
  }

  query += '\n      ORDER BY t.created_at DESC';
  const tutorsResult = await pool.query(query, values);
  const tutors = tutorsResult.rows;

  for (const tutor of tutors) {
    const subRes = await pool.query(`
         SELECT s.subject_name
         FROM TutorSubjects ts
         JOIN Subjects s ON ts.subject_id = s.subject_id
         WHERE ts.tutor_id = $1
      `, [tutor.tutor_id]);
    tutor.subjects = subRes.rows.map((r: any) => r.subject_name).join(', ');
  }

  return { tutors, total: tutors.length };
}

export async function getTutorByIdService(tutor_id: number) {
  if (!pool) throw new Error('Database not connected.');

  const tutorResult = await pool.query(`
       SELECT t.*, c.city_name, c.city_id, q.qualification_name, q.qualification_id,
              it.type_name AS institution_type, tm.mode_name AS teaching_mode
       FROM Tutors t
       INNER JOIN Cities c ON t.city_id = c.city_id
       INNER JOIN Qualifications q ON t.highest_qualification_id = q.qualification_id
       INNER JOIN InstitutionTypes it ON t.institution_type_id = it.institution_type_id
       INNER JOIN TeachingModes tm ON t.teaching_mode_id = tm.teaching_mode_id
       WHERE t.tutor_id = $1
    `, [tutor_id]);

  if (!tutorResult.rows || tutorResult.rows.length === 0) {
    throw new Error('Tutor not found');
  }

  const tutor = tutorResult.rows[0];
  tutor.name = [tutor.first_name, tutor.last_name].filter(Boolean).join(' ').trim() || tutor.username || 'Tutor';
  tutor.hourly_rate_pkr = tutor.hourly_rate_pkr;
  tutor.experience_years = tutor.years_of_experience;
  tutor.latest_degree_title = tutor.qualification_name;
  tutor.city = tutor.city_name;

  const subRes = await pool.query(`
       SELECT s.subject_name 
       FROM TutorSubjects ts 
       JOIN Subjects s ON ts.subject_id = s.subject_id 
       WHERE ts.tutor_id = $1
    `, [tutor.tutor_id]);
  tutor.subjects = subRes.rows.map((r: any) => r.subject_name).join(', ');

  const docs = await pool.query('SELECT document_type, file_path FROM TutorDocuments WHERE tutor_id = $1', [tutor.tutor_id]);

  for (const doc of docs.rows) {
    const normalizedPath = normalizeDocumentPath(doc.file_path || '');
    if (doc.document_type === 'ProfilePicture') tutor.profile_picture_path = normalizedPath;
    if (doc.document_type === 'DegreeCertificate') tutor.degree_certificate_path = normalizedPath;
    if (doc.document_type === 'CNIC') tutor.cnic_document_path = normalizedPath;
  }

  const availabilityRes = await pool.query('SELECT notes FROM TutorAvailability WHERE tutor_id = $1 AND is_available = TRUE', [tutor.tutor_id]);
  tutor.availability_schedule = availabilityRes.rows.map((r: any) => r.notes).join('; ');

  return tutor;
}

export async function getTutorProfileService(user_id: number) {
  if (!pool) throw new Error('Database not connected.');

  const tutorResult = await pool.query(`
       SELECT t.*, c.city_name, c.city_id, q.qualification_name, q.qualification_id,
              it.type_name AS institution_type, tm.mode_name AS teaching_mode
       FROM Tutors t
       INNER JOIN Cities c ON t.city_id = c.city_id
       INNER JOIN Qualifications q ON t.highest_qualification_id = q.qualification_id
       INNER JOIN InstitutionTypes it ON t.institution_type_id = it.institution_type_id
       INNER JOIN TeachingModes tm ON t.teaching_mode_id = tm.teaching_mode_id
       WHERE t.tutor_id = $1
    `, [user_id]);

  if (!tutorResult.rows || tutorResult.rows.length === 0) {
    throw new Error('Tutor not found');
  }

  const tutor = tutorResult.rows[0];
  tutor.name = `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim();
  tutor.hourly_rate_pkr = tutor.hourly_rate_pkr;
  tutor.experience_years = tutor.years_of_experience;
  tutor.latest_degree_title = tutor.qualification_name;
  tutor.city = tutor.city_name;

  const subRes = await pool.query(`
       SELECT s.subject_name 
       FROM TutorSubjects ts 
       JOIN Subjects s ON ts.subject_id = s.subject_id 
       WHERE ts.tutor_id = $1
    `, [tutor.tutor_id]);
  tutor.subjects = subRes.rows.map((r: any) => r.subject_name).join(', ');

  const docs = await pool.query('SELECT document_type, file_path FROM TutorDocuments WHERE tutor_id = $1', [tutor.tutor_id]);

  for (const doc of docs.rows) {
    const normalizedPath = normalizeDocumentPath(doc.file_path || '');
    if (doc.document_type === 'ProfilePicture') tutor.profile_picture_path = normalizedPath;
    if (doc.document_type === 'DegreeCertificate') tutor.degree_certificate_path = normalizedPath;
    if (doc.document_type === 'CNIC') tutor.cnic_document_path = normalizedPath;
  }

  const availabilityRes = await pool.query('SELECT notes FROM TutorAvailability WHERE tutor_id = $1 AND is_available = TRUE', [tutor.tutor_id]);
  tutor.availability_schedule = availabilityRes.rows.map((r: any) => r.notes).join('; ');

  return tutor;
}

export async function updateTutorProfileService(params: {
  user_id: number;
  name?: string;
  phone?: string;
  city?: string;
  city_id?: any;
  experience_years?: any;
  latest_degree_title?: string;
  qualification_id?: any;
  subjects?: string;
  hourly_rate_pkr?: any;
  bio?: string;
  teaching_institution_name?: string;
  institution_type?: string;
  teaching_mode?: string;
  availability_schedule?: any;
  files?: { [fieldname: string]: Express.Multer.File[] };
}) {
  const {
    user_id, name, phone, city, city_id, experience_years,
    latest_degree_title, qualification_id, subjects, hourly_rate_pkr,
    bio, teaching_institution_name, institution_type, teaching_mode,
    availability_schedule, files
  } = params;

  if (!pool) throw new Error('Database not connected.');

  const nameParts = name ? name.split(' ') : [''];
  const first_name = nameParts[0] || '';
  const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const selectedCityId = city_id ? parseInt(String(city_id), 10) : NaN;
  let city_id_value = !isNaN(selectedCityId) && selectedCityId > 0 ? selectedCityId : undefined;

  if (!city_id_value && city) {
    const cityResult = await pool.query('SELECT city_id FROM Cities WHERE city_name = $1', [city]);
    city_id_value = cityResult.rows[0]?.city_id;
  }

  if (!city_id_value) {
    city_id_value = 1;
  }

  const selectedQualificationId = qualification_id ? parseInt(String(qualification_id), 10) : NaN;
  let qual_id = !isNaN(selectedQualificationId) && selectedQualificationId > 0 ? selectedQualificationId : undefined;

  if (!qual_id && latest_degree_title) {
    const qualResult = await pool.query('SELECT qualification_id FROM Qualifications WHERE qualification_name = $1', [latest_degree_title]);
    qual_id = qualResult.rows[0]?.qualification_id;
  }

  if (!qual_id) {
    qual_id = 1;
  }

  const modeResult = await pool.query('SELECT teaching_mode_id FROM TeachingModes WHERE mode_name = $1', [teaching_mode]);
  const mode_id = modeResult.rows[0]?.teaching_mode_id || 1;

  await pool.query(`
      UPDATE Tutors SET
        first_name = $1,
        last_name = $2,
        phone = $3,
        city_id = $4,
        highest_qualification_id = $5,
        teaching_mode_id = $6,
        years_of_experience = $7,
        hourly_rate_pkr = $8,
        bio = $9,
        teaching_institution_name = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE tutor_id = $11
    `, [
      first_name,
      last_name,
      phone,
      city_id_value,
      qual_id,
      mode_id,
      experience_years,
      hourly_rate_pkr,
      bio,
      teaching_institution_name,
      user_id
    ]);

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

      await pool.query('DELETE FROM TutorDocuments WHERE tutor_id = $1 AND document_type = $2', [user_id, document.type]);
      await pool.query(`INSERT INTO TutorDocuments (tutor_id, document_type, document_title, file_path, file_size_kb, file_extension)
               VALUES ($1, $2, $3, $4, $5, $6)`, [
        user_id,
        document.type,
        metadata.document_title,
        normalizedPath,
        metadata.file_size_kb,
        metadata.file_extension
      ]);
    }
  }

  let parsedAvailability = null;
  try {
    parsedAvailability = parseAvailabilitySchedule(availability_schedule);
  } catch (err: any) {
    throw new Error(err.message || 'Invalid availability schedule format');
  }

  await pool.query('DELETE FROM TutorAvailability WHERE tutor_id = $1', [user_id]);
  if (parsedAvailability) {
    for (const entry of parsedAvailability) {
      await pool.query('INSERT INTO TutorAvailability (tutor_id, day_of_week, notes) VALUES ($1, $2, $3)', [
        user_id,
        entry.day_of_week,
        entry.notes
      ]);
    }
  }

  if (subjects && typeof subjects === 'string') {
    const subArray = subjects.split(',').map(s => s.trim());
    await pool.query('DELETE FROM TutorSubjects WHERE tutor_id = $1', [user_id]);
    for (const sub of subArray) {
      const subRes = await pool.query('SELECT subject_id FROM Subjects WHERE subject_name = $1', [sub]);
      let sub_id = subRes.rows[0]?.subject_id;
      if (!sub_id) {
        const newSub = await pool.query(
          'INSERT INTO Subjects (subject_name, category) VALUES ($1, $2) RETURNING subject_id',
          [sub, 'General']
        );
        sub_id = newSub.rows[0].subject_id;
      }
      await pool.query('INSERT INTO TutorSubjects (tutor_id, subject_id, expertise_level) VALUES ($1, $2, $3)', [
        user_id,
        sub_id,
        'Intermediate'
      ]);
    }
  }

  return { success: true };
}
