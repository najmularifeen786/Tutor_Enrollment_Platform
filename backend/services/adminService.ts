import { pool } from '../db/dbFunctions.js';

export async function getAllTutorsService(status?: string) {
  if (!pool) throw new Error('Database not connected.');

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

  return { tutors, total: tutors.length };
}

export async function getTutorDetailedService(tutor_id: number) {
  if (!pool) throw new Error('Database not connected.');

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
             t.hourly_rate_pkr,
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
    throw new Error('Tutor not found');
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

  const docs = await pool.query('SELECT document_type, file_path FROM TutorDocuments WHERE tutor_id = $1', [tutor_id]);

  tutor.name = tutor.full_name;
  tutor.hourly_rate_pkr = tutor.hourly_rate_pkr;
  tutor.experience_years = tutor.years_of_experience;
  tutor.latest_degree_title = tutor.qualification_name;
  tutor.city = tutor.city_name;
  tutor.subjects = subjectsResult.rows.map((s: any) => s.subject_name).join(', ') || 'No subjects';
  tutor.availability_schedule = availabilityResult.rows.map((a: any) => `${a.day_of_week}: ${a.start_time}-${a.end_time}`).join('; ') || 'No availability set';

  for (const doc of docs.rows) {
    if (doc.document_type === 'ProfilePicture') tutor.profile_picture_path = doc.file_path;
    if (doc.document_type === 'DegreeCertificate') tutor.degree_certificate_path = doc.file_path;
    if (doc.document_type === 'CNIC') tutor.cnic_document_path = doc.file_path;
  }

  return tutor;
}

export async function activateTutorService(tutor_id: number) {
  if (!pool) throw new Error('Database not connected.');

  await pool.query('UPDATE Tutors SET is_active = TRUE WHERE tutor_id = $1', [tutor_id]);
}

export async function deactivateTutorService(tutor_id: number) {
  if (!pool) throw new Error('Database not connected.');

  await pool.query('UPDATE Tutors SET is_active = FALSE WHERE tutor_id = $1', [tutor_id]);
}

export async function getStatisticsService() {
  if (!pool) throw new Error('Database not connected.');

  const statsResult = await pool.query(`
    SELECT
      COUNT(*) AS total_tutors,
      SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_tutors,
      SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) AS inactive_tutors,
      SUM(CASE WHEN created_at::date = CURRENT_DATE THEN 1 ELSE 0 END) AS new_tutors_today,
      COUNT(DISTINCT city_id) AS num_cities,
      AVG(hourly_rate_pkr::numeric(10,2)) AS avg_hourly_rate_pkr
    FROM Tutors
  `);

  const subjectsCountRes = await pool.query('SELECT COUNT(*) as count FROM Subjects');
  const stats = statsResult.rows[0] || {};

  return {
    total_tutors: stats.total_tutors,
    active_tutors: stats.active_tutors,
    inactive_tutors: stats.inactive_tutors,
    new_tutors_today: stats.new_tutors_today,
    total_registrations_today: stats.new_tutors_today,
    num_cities: stats.num_cities,
    avg_hourly_rate_pkr: stats.avg_hourly_rate_pkr,
    subjects_count: subjectsCountRes.rows[0].count
  };
}
