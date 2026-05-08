import { Router } from 'express';
import { obtenerAlertas } from '../controllers/reporte.controller.js';

const router = Router();

// GET /api/reportes/alertas - Obtener alertas de inventario
router.get('/alertas', obtenerAlertas);

export default router;
