import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    user_type: string;
    user_id: number;
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

  try {
    const secret = process.env.JWT_SECRET || 'your_secret_key';
    const payload = jwt.verify(token, secret);

    if (!payload || typeof payload !== 'object' || !('user_id' in payload) || !('user_type' in payload)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    req.user = {
      user_type: String(payload.user_type),
      user_id: Number(payload.user_id)
    };
    next();
  } catch (error: any) {
    console.error('Auth error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
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
