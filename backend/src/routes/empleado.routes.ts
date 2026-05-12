import { Router } from 'express';
import { buscarEmpleadoPorDni } from '../controllers/empleado.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

/** GET /api/empleados/buscar/:dni — solo Administrador */
router.get(
  '/buscar/:dni',
  verifyToken,
  requireRole('Administrador'),
  buscarEmpleadoPorDni
);

export default router;