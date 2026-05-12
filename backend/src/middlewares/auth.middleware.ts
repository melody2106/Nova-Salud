import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/index.js';

// Extender Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware que verifica el JWT en el header Authorization.
 * Si el token es inválido o no existe, responde 401.
 */
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ success: false, message: 'Token de autenticación requerido' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'secret_fallback';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Token expirado — inicia sesión nuevamente' });
    } else {
      res.status(401).json({ success: false, message: 'Token inválido' });
    }
  }
}

/**
 * Middleware de control de acceso por cargo (RBAC).
 * Úsalo después de verifyToken.
 * Ejemplo: requireRole('Administrador')
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const cargo = req.user?.cargo;
    if (!cargo || !roles.includes(cargo)) {
      res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de los roles: ${roles.join(', ')}`,
      });
      return;
    }
    next();
  };
}