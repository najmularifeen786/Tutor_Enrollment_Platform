# 📚 Tutor Enrollment Platform
 
A full-stack web application that connects students with qualified tutors across Pakistan. Tutors can register, upload credentials, and manage their profiles. Students can browse and search for tutors in real time. An admin panel provides full control over tutor visibility and platform management.
 
> 🎓 4th Semester Database Course Project — Built with React, Node.js, Express, and Microsoft SQL Server 2019.
 
---
 
## 📋 Table of Contents
 
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Database Design](#-database-design)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Credits](#-credits)
---
 
## ✨ Features
 
### Public (No Login Required)
- Browse all active tutors with full profile details
- Real-time search and filter by subject
- View individual tutor profiles (qualifications, subjects, availability, hourly rate)
- Light / Dark theme toggle
### Tutor
- Register with personal info, qualifications, subjects taught, and availability schedule
- Upload documents: Degree Certificate, CNIC, and Profile Picture
- Login and access personal dashboard
- Edit and update profile information
### Admin
- Login with admin credentials
- View all tutors (active and inactive)
- Activate or deactivate tutor accounts
- View platform statistics (total tutors, active/inactive counts, average hourly rate)
---
 
## 🛠 Tech Stack
 
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Axios, React Router DOM |
| Backend | Node.js, Express.js |
| Database | Microsoft SQL Server 2019 |
| File Uploads | Multer |
| Styling | CSS Variables (Light/Dark Theme) |
| AI Assistance | Google AI Studio (frontend scaffolding) |
 
---
 
## 🗄 Database Design
 
The database `TutorEnrollmentDB` is designed following **Third Normal Form (3NF)** — 10 tables with no data redundancy and full referential integrity.
 
### Tables Overview
 
| Table | Purpose |
|---|---|
| `Admins` | Administrator accounts |
| `Cities` | Lookup table — Pakistani cities (normalized) |
| `InstitutionTypes` | Lookup table — School / College / University |
| `TeachingModes` | Lookup table — Remote / Physical / Both |
| `Subjects` | Lookup table — 12 predefined subjects |
| `Qualifications` | Lookup table — Degree names and levels |
| `Tutors` | Main table — all tutor information |
| `TutorSubjects` | Junction table — many-to-many between Tutors and Subjects |
| `TutorDocuments` | Stores file paths for uploaded documents |
| `TutorAvailability` | Weekly availability schedule per tutor |
 
### Entity Relationships
 
```
Cities ──────────────────┐
Qualifications ──────────┤
InstitutionTypes ────────┼──► Tutors (Main Table)
TeachingModes ───────────┘         │
                                   ├──► TutorSubjects ◄──── Subjects
                                   ├──► TutorDocuments
                                   └──► TutorAvailability
```
 
### Key Design Decisions
 
- **Lookup tables** for Cities, Subjects, Qualifications, TeachingModes, and InstitutionTypes eliminate repeated string data across tutor records.
- **Junction table** `TutorSubjects` handles the many-to-many relationship between tutors and subjects, with expertise level stored per assignment.
- **ON DELETE CASCADE** on `TutorDocuments` and `TutorAvailability` ensures related records are cleaned up automatically.
- **Unique constraints** on `username`, `email`, and `cnic_number` in the Tutors table prevent duplicate registrations.
- **Check constraints** enforce valid data: `years_of_experience BETWEEN 0 AND 50`, `hourly_rate_pkr > 0`, `start_time < end_time`.
- **Performance indexes** on `is_active`, `city_id`, `email`, and `subject_id` for fast filtering and lookups.
---
 
## 📁 Project Structure
 
```
tutor-enrollment-platform/
│
├── backend/
│   ├── controllers/
│   │   ├── authController.js        # Registration & login logic
│   │   ├── tutorController.js       # Tutor CRUD operations
│   │   └── adminController.js       # Admin operations
│   ├── routes/
│   │   ├── auth.js                  # /api/auth routes
│   │   ├── tutors.js                # /api/tutors routes
│   │   └── admin.js                 # /api/admin routes
│   ├── middleware/
│   │   └── authMiddleware.js        # Request authentication check
│   ├── db/
│   │   └── dbFunctions.js           # All SQL queries (centralized)
│   ├── uploads/                     # Uploaded files (per tutor ID)
│   ├── server.js                    # Express server entry point
│   ├── .env                         # Environment variables (not committed)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── TutorCard.jsx
    │   │   ├── TutorGrid.jsx
    │   │   ├── SearchBar.jsx
    │   │   ├── AuthModal.jsx
    │   │   ├── TutorRegistrationForm.jsx
    │   │   ├── AdminTutorManagement.jsx
    │   │   └── TutorEditProfile.jsx
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegistrationPage.jsx
    │   │   ├── TutorProfilePage.jsx
    │   │   ├── TutorDashboard.jsx
    │   │   └── AdminPage.jsx
    │   ├── lib/
    │   │   └── constants.js          # Cities, Subjects, Qualifications lists
    │   ├── App.jsx                   # React Router setup
    │   ├── main.jsx                  # React entry point
    │   └── index.css                 # Global styles + CSS variables
    ├── vite.config.js
    └── package.json
```
 
---
 
## 📸 Screenshots
 
> Add screenshots here after deployment. Suggested images:
 
| Page | Description |
|---|---|
| Home Page | Landing page with navigation |
| Explore Tutors | Tutor grid with search bar |
| Tutor Profile | Full tutor detail page |
| Registration Form | Multi-step tutor registration |
| Tutor Dashboard | Logged-in tutor view |
| Admin Dashboard | Statistics + tutor management |
 
---
 
## 🚀 Getting Started
 
### Prerequisites
 
Make sure the following are installed on your Windows machine:
 
- [Node.js](https://nodejs.org/) (v18 or above)
- [Microsoft SQL Server 2019](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
- [Git](https://git-scm.com/)
---
 
### Step 1 — Clone the Repository
 
```bash
git clone https://github.com/najmularifeen786/Tutor_Enrollment_Platform.git
cd tutor-enrollment-platform
```
 
---
 
### Step 2 — Set Up the Database
 
1. Open **SQL Server Management Studio (SSMS)**
2. Connect to your local SQL Server instance
3. Open the file `database/TutorEnrollmentDB.sql` (or run the provided schema script)
4. Execute the script to create the database, all tables, constraints, indexes, and seed data
> The default admin account created by the seed script:
> - **Username:** `admin`
> - **Password:** `admin`
 
---
 
### Step 3 — Configure the Backend
 
```bash
cd backend
npm install
```
 
Create a `.env` file in the `backend/` folder:
 
```env
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=your_sql_server_password
DB_NAME=TutorEnrollmentDB
PORT=5000
```
 
> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.
 
Start the backend server:
 
```bash
npm run dev
```
 
The backend will run at: `http://localhost:5000`
 
---
 
### Step 4 — Configure the Frontend
 
Open a new terminal window:
 
```bash
cd frontend
npm install
npm run dev
```
 
The frontend will run at: `http://localhost:5173`
 
---
 
### Step 5 — Open the App
 
Visit `http://localhost:5173` in your browser.
 
- To explore tutors: no login required
- To register as a tutor: click **Register**
- To login as admin: use `admin` / `admin`
---
 
## 🔐 Environment Variables
 
| Variable | Description |
|---|---|
| `DB_SERVER` | SQL Server hostname (usually `localhost`) |
| `DB_USER` | SQL Server username (usually `sa`) |
| `DB_PASSWORD` | Your SQL Server password |
| `DB_NAME` | Database name (`TutorEnrollmentDB`) |
| `PORT` | Backend port (default: `5000`) |
 
---
 
## 📡 API Endpoints
 
### Auth Routes — `/api/auth`
 
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register-tutor` | Register a new tutor (with file uploads) |
| POST | `/api/auth/login` | Login for tutor or admin |
 
### Tutor Routes — `/api/tutors`
 
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tutors` | Get all active tutors |
| GET | `/api/tutors/:id` | Get single tutor profile |
| GET | `/api/tutors/search?subject=Math` | Search tutors by subject |
| GET | `/api/subjects` | Get all available subjects |
| PUT | `/api/tutors/profile/:id` | Update tutor profile |
 
### Admin Routes — `/api/admin`
 
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/tutors` | Get all tutors (active + inactive) |
| PUT | `/api/admin/tutors/:id/activate` | Activate a tutor |
| PUT | `/api/admin/tutors/:id/deactivate` | Deactivate a tutor |
| GET | `/api/admin/statistics` | Get platform statistics |
 
---
 
## 👥 Credits
 
| Name | Contribution |
|---|---|
| Najmul Arifeen | Full-stack development, database design, backend API, frontend integration, project architecture |
| Hasnat | Frontend design contributions and database architecture support |
 
> Parts of the frontend were initially scaffolded using **Google AI Studio** and then heavily customized, restructured, and extended to meet the project requirements — following modern AI-assisted development practices.
 
---
 
## 📄 License
 
This project was developed as an academic project for the Database course (4th Semester). Not licensed for commercial use.
