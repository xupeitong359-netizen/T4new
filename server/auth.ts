import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, DBUser } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'nation_lobby_super_secret_jwt_key_2026_x89f';

export interface AuthRequest extends Request {
  user?: DBUser;
}

export function signToken(user: DBUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '30d' } // 30-day persistent session across browser close
  );
}

export function verifyToken(token: string): { id: string; username: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录后再进行此操作' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: '登录状态已过期或无效，请重新登录' });
  }

  const user = db.findUserById(payload.id);
  if (!user) {
    return res.status(401).json({ error: '用户不存在或已被注销' });
  }

  req.user = user;
  next();
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      const user = db.findUserById(payload.id);
      if (user) {
        req.user = user;
      }
    }
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: '无权限执行此管理操作，需要管理员权限' });
    }
    next();
  });
}
