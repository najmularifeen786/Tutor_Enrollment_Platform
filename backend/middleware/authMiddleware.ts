import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/dbFunctions.js';
import sql from 'mssql';

export interface AuthRequest extends Request {
  user?: {
    user_type: string;
    user_id: number;
    session_token: string;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No authorization header provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Invalid token format' });
  }

  if (!pool) {
    return res.status(500).json({ success: false, message: 'Database not connected.' });
  }

  try {
    const sessionRes = await pool.request()
      .input('token', sql.NVarChar, token)
      .query('SELECT * FROM Sessions WHERE session_token = @token AND expires_at > GETDATE()');
    
    const session = sessionRes.recordset[0];
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Session expired or invalid' });
    }

    req.user = {
      user_type: session.user_type,
      user_id: session.user_id,
      session_token: token
    };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
}

export function adminAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    if (req.user?.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  });
}
