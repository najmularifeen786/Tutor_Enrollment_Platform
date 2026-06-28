-- Converted PostgreSQL schema for Neon (PostgreSQL 16)
-- Preserves design, constraints, defaults and indexes from the original SQL Server schema
-- Types and syntax converted for PostgreSQL compatibility

/* Tables */

CREATE TABLE Tutors (
    tutor_id integer GENERATED ALWAYS AS IDENTITY,
    username varchar(50) NOT NULL,
    password varchar(255) NOT NULL,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    email varchar(100) NOT NULL,
    phone varchar(15) NOT NULL,
    city_id integer NOT NULL,
    highest_qualification_id integer NOT NULL,
    institution_type_id integer NOT NULL,
    teaching_mode_id integer NOT NULL,
    years_of_experience integer NOT NULL,
    cnic_number varchar(20) NOT NULL,
    hourly_rate_pkr numeric(10,2) NOT NULL,
    bio text,
    teaching_institution_name varchar(150),
    is_active boolean DEFAULT true,
    registration_date timestamp DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tutor_id),
    UNIQUE (cnic_number),
    UNIQUE (email),
    UNIQUE (username)
);

CREATE TABLE Cities (
    city_id integer GENERATED ALWAYS AS IDENTITY,
    city_name varchar(100) NOT NULL,
    province varchar(100),
    country varchar(100),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (city_id),
    UNIQUE (city_name)
);

CREATE TABLE InstitutionTypes (
    institution_type_id integer GENERATED ALWAYS AS IDENTITY,
    type_name varchar(50) NOT NULL,
    description varchar(255),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (institution_type_id),
    UNIQUE (type_name)
);

CREATE TABLE TeachingModes (
    teaching_mode_id integer GENERATED ALWAYS AS IDENTITY,
    mode_name varchar(50) NOT NULL,
    description varchar(255),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (teaching_mode_id),
    UNIQUE (mode_name)
);

CREATE TABLE Qualifications (
    qualification_id integer GENERATED ALWAYS AS IDENTITY,
    qualification_name varchar(150) NOT NULL,
    qualification_level varchar(50),
    field_of_study varchar(100),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (qualification_id),
    UNIQUE (qualification_name)
);

CREATE TABLE Subjects (
    subject_id integer GENERATED ALWAYS AS IDENTITY,
    subject_name varchar(100) NOT NULL,
    category varchar(50),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (subject_id),
    UNIQUE (subject_name)
);

CREATE TABLE TutorSubjects (
    tutor_subject_id integer GENERATED ALWAYS AS IDENTITY,
    tutor_id integer NOT NULL,
    subject_id integer NOT NULL,
    expertise_level varchar(50),
    added_date timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tutor_subject_id),
    CONSTRAINT UQ_TutorSubjects UNIQUE (tutor_id, subject_id)
);

CREATE TABLE TutorAvailability (
    availability_id integer GENERATED ALWAYS AS IDENTITY,
    tutor_id integer NOT NULL,
    day_of_week varchar(20) NOT NULL,
    start_time time,
    end_time time,
    is_available boolean DEFAULT true,
    notes varchar(255),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (availability_id),
    CONSTRAINT CK_TutorAvailability_Times CHECK (start_time < end_time)
);

CREATE TABLE TutorDocuments (
    document_id integer GENERATED ALWAYS AS IDENTITY,
    tutor_id integer NOT NULL,
    document_type varchar(50) NOT NULL,
    document_title varchar(150),
    file_path varchar(500) NOT NULL,
    file_size_kb integer,
    file_extension varchar(10),
    uploaded_date timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (document_id),
    CONSTRAINT CK_TutorDocuments_FileSize CHECK (file_size_kb > 0 AND file_size_kb <= 5120)
);

CREATE TABLE Admins (
    admin_id integer GENERATED ALWAYS AS IDENTITY,
    username varchar(50) NOT NULL,
    password varchar(255) NOT NULL,
    email varchar(100),
    full_name varchar(100),
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (admin_id),
    UNIQUE (username)
);

CREATE TABLE AuditLog (
    audit_id integer GENERATED ALWAYS AS IDENTITY,
    table_name varchar(100),
    action varchar(20),
    tutor_id integer,
    old_status boolean,
    new_status boolean,
    changed_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (audit_id)
);

/* Indexes (converted to PostgreSQL) */

CREATE INDEX IDX_AuditLog_TutorChanged ON AuditLog (tutor_id ASC, changed_at ASC);
CREATE INDEX idx_cities_name ON Cities (city_name ASC);
CREATE INDEX idx_subjects_category ON Subjects (category ASC);
CREATE INDEX idx_subjects_name ON Subjects (subject_name ASC);
CREATE INDEX idx_tutoravailability_day ON TutorAvailability (day_of_week ASC);
CREATE INDEX IDX_TutorAvailability_DayAvailable ON TutorAvailability (day_of_week ASC, is_available ASC);
CREATE INDEX idx_tutoravailability_tutor_id ON TutorAvailability (tutor_id ASC);
CREATE INDEX idx_tutordocuments_tutor_id ON TutorDocuments (tutor_id ASC);
CREATE INDEX idx_tutordocuments_type ON TutorDocuments (document_type ASC);
CREATE INDEX IDX_TutorDocuments_TypeUploadDate ON TutorDocuments (document_type ASC, uploaded_date ASC);
CREATE INDEX IDX_Tutors_ActiveCity ON Tutors (is_active ASC, city_id ASC);
CREATE INDEX idx_tutors_city_id ON Tutors (city_id ASC);
CREATE INDEX idx_tutors_cnic ON Tutors (cnic_number ASC);
CREATE INDEX idx_tutors_created_at ON Tutors (created_at ASC);
CREATE INDEX idx_tutors_email ON Tutors (email ASC);
CREATE INDEX idx_tutors_hourly_rate_pkr ON Tutors (hourly_rate_pkr ASC);
CREATE INDEX idx_tutors_is_active ON Tutors (is_active ASC);
CREATE INDEX idx_tutors_username ON Tutors (username ASC);
CREATE INDEX idx_tutorsubjects_subject_id ON TutorSubjects (subject_id ASC);
CREATE INDEX IDX_TutorSubjects_SubjectTutor ON TutorSubjects (subject_id ASC, tutor_id ASC);
CREATE INDEX idx_tutorsubjects_tutor_id ON TutorSubjects (tutor_id ASC);

/* Foreign keys and constraints */

ALTER TABLE TutorAvailability
    ADD CONSTRAINT FK_TutorAvailability_Tutors FOREIGN KEY (tutor_id)
    REFERENCES Tutors (tutor_id) ON DELETE CASCADE;

ALTER TABLE TutorDocuments
    ADD CONSTRAINT FK_TutorDocuments_Tutors FOREIGN KEY (tutor_id)
    REFERENCES Tutors (tutor_id) ON DELETE CASCADE;

ALTER TABLE Tutors
    ADD CONSTRAINT FK_Tutors_Cities FOREIGN KEY (city_id)
    REFERENCES Cities (city_id);

ALTER TABLE Tutors
    ADD CONSTRAINT FK_Tutors_InstitutionTypes FOREIGN KEY (institution_type_id)
    REFERENCES InstitutionTypes (institution_type_id);

ALTER TABLE Tutors
    ADD CONSTRAINT FK_Tutors_Qualifications FOREIGN KEY (highest_qualification_id)
    REFERENCES Qualifications (qualification_id);

ALTER TABLE Tutors
    ADD CONSTRAINT FK_Tutors_TeachingModes FOREIGN KEY (teaching_mode_id)
    REFERENCES TeachingModes (teaching_mode_id);

ALTER TABLE TutorSubjects
    ADD CONSTRAINT FK_TutorSubjects_Subjects FOREIGN KEY (subject_id)
    REFERENCES Subjects (subject_id);

ALTER TABLE TutorSubjects
    ADD CONSTRAINT FK_TutorSubjects_Tutors FOREIGN KEY (tutor_id)
    REFERENCES Tutors (tutor_id) ON DELETE CASCADE;

/* Check constraints already added inline where appropriate */

-- End of converted schema
