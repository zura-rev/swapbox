import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'ავტორიზაცია საჭიროა' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'არასწორი ტოკენი' });
  }
}

// Optional auth — doesn't block, just attaches userId if available
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      req.userId = decoded.userId;
    } catch {}
  }

  next();
}
