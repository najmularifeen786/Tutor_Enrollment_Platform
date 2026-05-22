import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

export let pool: sql.ConnectionPool;

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'NAJAM', // e.g. NAJAM
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
  database: process.env.DB_DATABASE || 'TutorEnrollmentDB',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use this if you're on Windows Azure
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true' // Change to true for local dev / self-signed certs
  }
};

export async function initializeDatabase() {
  try {
    pool = await sql.connect(config);
    console.log("Connected to SQL Server");
    
    // Ensure Sessions table exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Sessions' and xtype='U')
      BEGIN
          CREATE TABLE Sessions (
              session_id INT PRIMARY KEY IDENTITY(1,1),
              user_type NVARCHAR(50) NOT NULL,
              user_id INT NOT NULL,
              session_token NVARCHAR(255) NOT NULL UNIQUE,
              created_at DATETIME DEFAULT GETDATE(),
              expires_at DATETIME NOT NULL,
              is_active BIT DEFAULT 1
          );
          
          CREATE INDEX IDX_Sessions_Token ON Sessions(session_token);
          CREATE INDEX IDX_Sessions_UserId ON Sessions(user_id, user_type);
          
          PRINT 'Sessions table initialized successfully!';
      END
    `);
  } catch (err) {
    console.error("Database Connection Failed!", err);
    throw err;
  }
}

