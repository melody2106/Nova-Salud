import { Router } from 'express';
import { registrarVenta } from '../controllers/venta.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

/** POST /api/ventas/ — Administrador y Vendedor */
router.post('/', verifyToken, requireRole('Administrador', 'Vendedor'), registrarVenta);

export default router;