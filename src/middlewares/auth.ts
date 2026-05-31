import jwt from 'jsonwebtoken';
import { db, JWT_SECRET } from '../db';

export const requireAuth = (roles?: string[]) => {
  return async (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET!) as any;
      req.user = await db.getUserById(decoded.userId);
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (roles && !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
};
