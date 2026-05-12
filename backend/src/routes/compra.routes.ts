import { Router } from 'express';
import { registrarCompra } from '../controllers/compra.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

/** POST /api/compras/ — Administrador y Almacenero */
router.post(
  '/',
  verifyToken,
  requireRole('Administrador', 'Almacenero'),
  registrarCompra
);

export default router;