import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

import authRoutes from './backend/routes/auth.js';
import tutorRoutes from './backend/routes/tutors.js';
import adminRoutes from './backend/routes/admin.js';
import { initializeDatabase } from './backend/db/dbFunctions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Initialize uploads dir
const uploadsDir = path.join(__dirname, 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/admin', adminRoutes);

// Subjects route
app.get('/api/subjects', async (req, res) => {
  try {
    const { pool } = await import('./backend/db/dbFunctions.js');
    if (!pool) {
      return res.status(500).json({ success: false, data: [] });
    }
    const result = await pool.request().query('SELECT subject_name FROM Subjects');
    res.json({
      success: true,
      data: result.recordset.map(r => r.subject_name)
    });
  } catch (err) {
    console.error("Fetch subjects error", err);
    res.status(500).json({ success: false, data: [] });
  }
});

app.get('/api/cities', async (req, res) => {
  try {
    const { pool } = await import('./backend/db/dbFunctions.js');
    if (!pool) {
      return res.status(500).json({ success: false, data: [] });
    }
    const result = await pool.request().query('SELECT city_id, city_name FROM Cities ORDER BY city_id');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Fetch cities error", err);
    res.status(500).json({ success: false, data: [] });
  }
});

app.get('/api/qualifications', async (req, res) => {
  try {
    const { pool } = await import('./backend/db/dbFunctions.js');
    if (!pool) {
      return res.status(500).json({ success: false, data: [] });
    }
    const result = await pool.request().query('SELECT qualification_id, qualification_name, qualification_level FROM Qualifications ORDER BY qualification_id');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Fetch qualifications error", err);
    res.status(500).json({ success: false, data: [] });
  }
});

async function startServer() {
  try {
    await initializeDatabase();
  } catch (err) {
    console.error("Failed to initialize database: Your local SQL Server (NAJAM) is unreachable from this cloud preview. It will work when you run the app locally!");
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
