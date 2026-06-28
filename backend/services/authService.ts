import path from 'path';
import { pool } from '../db/dbFunctions.js';
import jwt from 'jsonwebtoken';

const normalizeDocumentPath = (filePath: string) => filePath.replace(/^\/?uploads\/?/, '');
const normalizeCNIC = (cnic?: string) => String(cnic || '').replace(/\D/g, '');
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

  const parsed: { day_of_week: string; start_time: string; end_time: string; notes: string }[] = [];
  const scheduleRegex = /^(.+?)\s*:\s*(.+)$/;

  const formatTime = (hour: number, minute: number) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  const convertHour = (hour: number, period?: string, referenceHour?: number) => {
    let normalized = hour;
    if (period) {
      const lower = period.toLowerCase();
      if (lower === 'am') {
        if (normalized === 12) normalized = 0;
      } else if (lower === 'pm') {
        if (normalized < 12) normalized += 12;
      }
    } else if (referenceHour !== undefined && normalized <= referenceHour) {
      normalized += 12;
    }
    return normalized;
  };

  for (const entry of entries) {
    const match = entry.match(scheduleRegex);
    if (!match) {
      throw new Error('Availability schedule must use the format "Day or Range: time-range" separated by commas, or enter "please contact".');
    }
    const day_of_week = match[1].trim();
    const timeNote = match[2].trim();

    const timeMatch = timeNote.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/i);

    let start_time = '09:00:00';
    let end_time = '17:00:00';

    if (timeMatch) {
      const startHour = parseInt(timeMatch[1], 10);
      const startMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const startPeriod = timeMatch[3];
      const endHour = parseInt(timeMatch[4], 10);
      const endMin = timeMatch[5] ? parseInt(timeMatch[5], 10) : 0;
      const endPeriod = timeMatch[6] || startPeriod;

      const normalizedStartHour = convertHour(startHour, startPeriod);
      const normalizedEndHour = convertHour(endHour, endPeriod, startPeriod ? undefined : normalizedStartHour);

      start_time = formatTime(normalizedStartHour, startMin);
      end_time = formatTime(normalizedEndHour, endMin);
    }

    if (!day_of_week) {
      throw new Error('Availability schedule must include both a day and time range.');
    }
    parsed.push({ day_of_week, start_time, end_time, notes: timeNote });
  }

  return parsed;
};

export async function registerTutorService(params: {
  username: string;
  password: string;
  name: string;
  phone: string;
  email: string;
  city_id?: any;
  city?: string;
  qualification_id?: any;
  latest_degree_title?: string;
  experience_years?: any;
  cnic_number?: string;
  subjects?: string;
  hourly_rate_pkr?: any;
  bio?: string;
  teaching_institution_name?: string;
  institution_type?: string;
  teaching_mode?: string;
  availability_schedule?: any;
  files: { [fieldname: string]: Express.Multer.File[] };
}) {
  if (!pool) throw new Error('Database not connected.');

  const {
    username, password, name, phone, email,
    city_id, city, qualification_id, latest_degree_title,
    experience_years, cnic_number, subjects, hourly_rate_pkr,
    bio, teaching_institution_name, institution_type, teaching_mode,
    availability_schedule, files
  } = params;

  const usernameValue = String(username || '').trim();
  const emailValue = String(email || '').trim();
  const phoneValue = String(phone || '').trim();
  const teachingInstitutionValue = String(teaching_institution_name || '').trim();
  const bioValue = String(bio || '').trim();

  if (!usernameValue || !password || !name || !emailValue) {
    throw new Error('Please provide username, password, name, and email.');
  }

  const nameParts = name ? name.split(' ') : [''];
  const first_name = nameParts[0];
  const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const selectedCityId = city_id ? parseInt(String(city_id), 10) : NaN;
  let city_id_value: number | undefined;

  if (!isNaN(selectedCityId) && selectedCityId > 0) {
    const cityResult = await pool.query('SELECT city_id FROM Cities WHERE city_id = $1', [selectedCityId]);
    city_id_value = cityResult.rows[0]?.city_id;
  }

  if (!city_id_value && city) {
    const cityResult = await pool.query('SELECT city_id FROM Cities WHERE city_name = $1', [city]);
    city_id_value = cityResult.rows[0]?.city_id;
  }

  if (!city_id_value) {
    const newCity = await pool.query('INSERT INTO Cities (city_name) VALUES ($1) RETURNING city_id', [city || 'Unknown']);
    city_id_value = newCity.rows[0].city_id;
  }

  const selectedQualificationId = qualification_id ? parseInt(String(qualification_id), 10) : NaN;
  let qual_id = undefined;

  if (!isNaN(selectedQualificationId) && selectedQualificationId > 0) {
    const qualResult = await pool.query('SELECT qualification_id FROM Qualifications WHERE qualification_id = $1', [selectedQualificationId]);
    qual_id = qualResult.rows[0]?.qualification_id;
  }

  if (!qual_id && latest_degree_title) {
    const qualResult = await pool.query('SELECT qualification_id FROM Qualifications WHERE qualification_name = $1', [latest_degree_title]);
    qual_id = qualResult.rows[0]?.qualification_id;
  }

  if (!qual_id) {
    qual_id = 1;
  }

  const instResult = await pool.query('SELECT institution_type_id FROM InstitutionTypes WHERE type_name = $1', [institution_type]);
  const inst_id = instResult.rows[0]?.institution_type_id || 1;

  const modeResult = await pool.query('SELECT teaching_mode_id FROM TeachingModes WHERE mode_name = $1', [teaching_mode]);
  const mode_id = modeResult.rows[0]?.teaching_mode_id || 1;

  const experienceYears = parseInt(String(experience_years), 10) || 0;
  const hourlyRate = parseFloat(String(hourly_rate_pkr)) || 0.0;
  const normalizedCnic = normalizeCNIC(cnic_number);

  if (!/^[0-9]{13}$/.test(normalizedCnic)) {
    throw new Error('Invalid CNIC format. Must contain exactly 13 digits.');
  }

  const result = await pool.query(
    `INSERT INTO Tutors
             (username, password, first_name, last_name, email, phone,
              city_id, highest_qualification_id, institution_type_id, teaching_mode_id,
              years_of_experience, cnic_number, hourly_rate_pkr, bio, teaching_institution_name)
             VALUES
             ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             RETURNING tutor_id`,
    [
      usernameValue,
      password,
      first_name,
      last_name,
      emailValue,
      phoneValue,
      city_id_value,
      qual_id,
      inst_id,
      mode_id,
      experienceYears,
      normalizedCnic,
      hourlyRate,
      bioValue,
      teachingInstitutionValue
    ]
  );

  const tutor_id = result.rows[0]?.tutor_id;
  if (!tutor_id) {
    throw new Error('Failed to create tutor record');
  }

  const documentMappings = [
    { field: 'profile_picture', type: 'ProfilePicture' },
    { field: 'degree_certificate', type: 'DegreeCertificate' },
    { field: 'cnic_document', type: 'CNIC' }
  ];

  for (const document of documentMappings) {
    const file = files[document.field]?.[0];
    if (file) {
      const metadata = getDocumentMetadata(file);
      const normalizedPath = normalizeDocumentPath(metadata.file_name);
      await pool.query(
        `INSERT INTO TutorDocuments (tutor_id, document_type, document_title, file_path, file_size_kb, file_extension)
               VALUES ($1, $2, $3, $4, $5, $6)`,
        [tutor_id, document.type, metadata.document_title, normalizedPath, metadata.file_size_kb, metadata.file_extension]
      );
    }
  }

  let parsedAvailability = null;
  try {
    parsedAvailability = parseAvailabilitySchedule(availability_schedule);
  } catch (err: any) {
    throw new Error(err.message || 'Invalid availability schedule format');
  }

  if (parsedAvailability) {
    for (const entry of parsedAvailability) {
      await pool.query(
        `INSERT INTO TutorAvailability (tutor_id, day_of_week, start_time, end_time, notes)
                VALUES ($1, $2, $3, $4, $5)`,
        [tutor_id, entry.day_of_week, entry.start_time, entry.end_time, entry.notes || null]
      );
    }
  }

  if (subjects && typeof subjects === 'string') {
    const subArray = subjects.split(',').map(s => s.trim());
    for (const sub of subArray) {
      const subRes = await pool.query('SELECT subject_id FROM Subjects WHERE subject_name = $1', [sub]);
      let sub_id = subRes.rows[0]?.subject_id;
      if (!sub_id) {
        const newSub = await pool.query(
          'INSERT INTO Subjects (subject_name, category) VALUES ($1, $2) RETURNING subject_id',
          [sub, 'General']
        );
        sub_id = newSub.rows[0]?.subject_id;
      }
      await pool.query(
        'INSERT INTO TutorSubjects (tutor_id, subject_id, expertise_level) VALUES ($1, $2, $3)',
        [tutor_id, sub_id, 'Intermediate']
      );
    }
  }

  return { tutor_id };
}

export async function loginService(username: string, password: string, user_type: string) {
  if (!pool) throw new Error('Database not connected.');

  let user: any = null;

  if (user_type === 'admin') {
    const adminRes = await pool.query('SELECT admin_id as id, password FROM Admins WHERE username = $1', [username]);
    user = adminRes.rows[0];
  } else if (user_type === 'tutor') {
    const tutorRes = await pool.query('SELECT tutor_id as id, password, is_active FROM Tutors WHERE username = $1', [username]);
    user = tutorRes.rows[0];
  } else {
    throw new Error('Invalid user_type');
  }

  if (!user || user.password !== password) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { user_id: user.id, user_type },
    process.env.JWT_SECRET || 'your_secret_key',
    { expiresIn: '24h' }
  );

  return { token, user_type, user_id: user.id };
}
