import { Router } from 'express';
import { obtenerAlertas, descargarComprobantePDF } from '../controllers/reporte.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

/** GET /api/reportes/alertas — Administrador y Almacenero */
router.get(
  '/alertas',
  verifyToken,
  requireRole('Administrador', 'Almacenero'),
  obtenerAlertas
);

/** GET /api/reportes/pdf/:id_venta — Descarga de comprobante */
router.get(
  '/pdf/:id_venta', 
  descargarComprobantePDF
);

export default router;