import { Request, Response } from 'express';
import path from 'path';
import { pool } from '../db/dbFunctions.js';
import sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';

const normalizeDocumentPath = (filePath: string) => filePath.replace(/^\/?uploads\/?/, '');
const normalizeCNIC = (cnic: string) => String(cnic || '').replace(/\D/g, '');
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

    // Parse time range (e.g., "9-5", "09:00-17:00", "9:00 AM - 5:00 PM")
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

export const registerTutor = async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    const {
      username, password, name, phone, email,
      city_id, city, qualification_id, latest_degree_title,
      experience_years, cnic_number, subjects, hourly_rate,
      bio, teaching_institution, institution_type, teaching_mode,
      availability_schedule
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const usernameValue = String(username || '').trim();
    const emailValue = String(email || '').trim();
    const phoneValue = String(phone || '').trim();
    const teachingInstitutionValue = String(teaching_institution || '').trim();
    const bioValue = String(bio || '').trim();

    if (!usernameValue || !password || !name || !emailValue) {
      return res.status(400).json({ success: false, message: 'Please provide username, password, name, and email.' });
    }

    const nameParts = name ? name.split(' ') : [''];
    const first_name = nameParts[0];
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Resolve city_id
    const selectedCityId = city_id ? parseInt(String(city_id), 10) : NaN;
    let city_id_value: number | undefined;

    if (!isNaN(selectedCityId) && selectedCityId > 0) {
      const cityResult = await pool.request()
        .input('city_id', sql.Int, selectedCityId)
        .query('SELECT city_id FROM Cities WHERE city_id = @city_id');
      city_id_value = cityResult.recordset[0]?.city_id;
    }

    if (!city_id_value && city) {
      const cityResult = await pool.request()
        .input('city_name', sql.NVarChar, city)
        .query('SELECT city_id FROM Cities WHERE city_name = @city_name');
      city_id_value = cityResult.recordset[0]?.city_id;
    }

    if (!city_id_value) {
      const newCity = await pool.request()
        .input('city_name', sql.NVarChar, city || 'Unknown')
        .query('INSERT INTO Cities (city_name) OUTPUT INSERTED.city_id VALUES (@city_name)');
      city_id_value = newCity.recordset[0].city_id;
    }

    // Resolve qualification_id
    const selectedQualificationId = qualification_id ? parseInt(String(qualification_id), 10) : NaN;
    let qual_id = undefined;

    if (!isNaN(selectedQualificationId) && selectedQualificationId > 0) {
      const qualResult = await pool.request()
        .input('qualification_id', sql.Int, selectedQualificationId)
        .query('SELECT qualification_id FROM Qualifications WHERE qualification_id = @qualification_id');
      qual_id = qualResult.recordset[0]?.qualification_id;
    }

    if (!qual_id && latest_degree_title) {
      const qualResult = await pool.request()
        .input('qual_name', sql.NVarChar, latest_degree_title)
        .query('SELECT qualification_id FROM Qualifications WHERE qualification_name = @qual_name');
      qual_id = qualResult.recordset[0]?.qualification_id;
    }

    if (!qual_id) {
      qual_id = 1;
    }

    // Resolve institution_type_id
    const instResult = await pool.request()
      .input('type_name', sql.NVarChar, institution_type)
      .query('SELECT institution_type_id FROM InstitutionTypes WHERE type_name = @type_name');
    let inst_id = instResult.recordset[0]?.institution_type_id || 1;

    // Resolve teaching_mode_id
    const modeResult = await pool.request()
        .input('mode_name', sql.NVarChar, teaching_mode)
        .query('SELECT teaching_mode_id FROM TeachingModes WHERE mode_name = @mode_name');
    let mode_id = modeResult.recordset[0]?.teaching_mode_id || 1;

    const experienceYears = parseInt(String(experience_years), 10) || 0;
    const hourlyRate = parseFloat(String(hourly_rate)) || 0.0;
    const normalizedCnic = normalizeCNIC(cnic_number);

    if (!/^[0-9]{13}$/.test(normalizedCnic)) {
      return res.status(400).json({ success: false, message: 'Invalid CNIC format. Must contain exactly 13 digits.' });
    }

    // Use SP_RegisterTutor stored procedure
    let tutor_id: number | null = null;
    try {
      const result = await pool.request()
        .input('username', sql.NVarChar(50), usernameValue)
        .input('password', sql.NVarChar(255), password)
        .input('firstName', sql.NVarChar(100), first_name)
        .input('lastName', sql.NVarChar(100), last_name)
        .input('email', sql.NVarChar(100), emailValue)
        .input('phone', sql.NVarChar(15), phoneValue)
        .input('cityId', sql.Int, city_id_value)
        .input('qualificationId', sql.Int, qual_id)
        .input('institutionTypeId', sql.Int, inst_id)
        .input('teachingModeId', sql.Int, mode_id)
        .input('yearsExperience', sql.Int, experienceYears)
        .input('cnicNumber', sql.NVarChar(20), normalizedCnic)
        .input('hourlyRate', sql.Decimal(10, 2), hourlyRate)
        .input('bio', sql.NVarChar(sql.MAX), bioValue)
        .input('teachingInstitution', sql.NVarChar(150), teachingInstitutionValue)
        .output('newTutorId', sql.Int)
        .execute('SP_RegisterTutor');

      tutor_id = result.output.newTutorId;

      if (!tutor_id) {
        return res.status(400).json({ success: false, message: 'Failed to create tutor record' });
      }
    } catch (err: any) {
      console.error('SP_RegisterTutor error', err);
      const sqlMessage = err.originalError?.info?.message || err.originalError?.message;
      const errorMessage = sqlMessage || err.message || 'Registration failed';
      return res.status(400).json({ success: false, message: errorMessage });
    }

    // Upload documents
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
        await pool.request()
          .input('tutor_id', sql.Int, tutor_id)
          .input('document_type', sql.NVarChar, document.type)
          .input('document_title', sql.NVarChar, metadata.document_title)
          .input('file_path', sql.NVarChar, normalizedPath)
          .input('file_size_kb', sql.Int, metadata.file_size_kb)
          .input('file_extension', sql.NVarChar, metadata.file_extension)
          .query(`INSERT INTO TutorDocuments (tutor_id, document_type, document_title, file_path, file_size_kb, file_extension)
                 VALUES (@tutor_id, @document_type, @document_title, @file_path, @file_size_kb, @file_extension)`);
      }
    }

    // Add availability
    let parsedAvailability = null;
    try {
      parsedAvailability = parseAvailabilitySchedule(availability_schedule);
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Invalid availability schedule format' });
    }

    if (parsedAvailability) {
      for (const entry of parsedAvailability) {
        try {
          await pool.request()
            .input('tutorId', sql.Int, tutor_id)
            .input('dayOfWeek', sql.NVarChar(20), entry.day_of_week)
            .input('startTime', sql.Time, entry.start_time)
            .input('endTime', sql.Time, entry.end_time)
            .input('notes', sql.NVarChar(255), entry.notes || null)
            .execute('SP_AddTutorAvailability');
        } catch (err: any) {
          console.error('Error adding availability:', err);
          // Continue even if availability fails
        }
      }
    }

    // Add subjects
    if (subjects && typeof subjects === 'string') {
        const subArray = subjects.split(',').map(s => s.trim());
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
            try {
              await pool.request()
                .input('tutorId', sql.Int, tutor_id)
                .input('subjectId', sql.Int, sub_id)
                .input('expertiseLevel', sql.NVarChar(50), 'Intermediate')
                .execute('SP_AddTutorSubject');
            } catch (err: any) {
              console.error('Error adding subject:', err);
              // Continue even if subject fails
            }
        }
    }

    res.json({
      success: true,
      message: "Tutor registered successfully",
      tutor_id: tutor_id
    });
  } catch (error: any) {
    console.error('Registration error', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    const { username, password, user_type } = req.body;

    let user: any = null;

    if (user_type === 'admin') {
      const adminRes = await pool.request()
         .input('username', sql.NVarChar, username)
         .query('SELECT admin_id as id, password FROM Admins WHERE username = @username');
      user = adminRes.recordset[0];
    } else if (user_type === 'tutor') {
      const tutorRes = await pool.request()
         .input('username', sql.NVarChar, username)
         .query('SELECT tutor_id as id, password, is_active FROM Tutors WHERE username = @username');
      user = tutorRes.recordset[0];
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user_type' });
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const session_token = uuidv4();
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Insert session into Sessions table (table is created in dbFunctions.ts initialization)
    try {
        await pool.request()
          .input('user_type', sql.NVarChar(50), user_type)
          .input('user_id', sql.Int, user.id)
          .input('session_token', sql.NVarChar(255), session_token)
          .input('expires_at', sql.DateTime, expires_at)
          .query(`
            INSERT INTO Sessions (user_type, user_id, session_token, expires_at, is_active)
            VALUES (@user_type, @user_id, @session_token, @expires_at, 1)
          `);
    } catch(err) {
       console.error("Session insert error", err);
       return res.status(500).json({ success: false, message: 'Failed to create session' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      session_token,
      user_type,
      user_id: user.id
    });

  } catch (error: any) {
    console.error('Login error', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not connected.' });
    }

    const { session_token } = req.body;
    await pool.request()
      .input('session_token', sql.NVarChar(255), session_token)
      .query('UPDATE Sessions SET is_active = 0 WHERE session_token = @session_token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

