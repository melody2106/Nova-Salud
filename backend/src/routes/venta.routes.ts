import { Router } from 'express';
import { registrarVenta } from '../controllers/venta.controller.js';

const router = Router();

// POST /api/ventas/ - Registrar una venta completa
router.post('/', registrarVenta);

export default router;
