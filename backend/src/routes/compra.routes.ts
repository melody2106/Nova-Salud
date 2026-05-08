import { Router } from 'express';
import { registrarCompra } from '../controllers/compra.controller.js';

const router = Router();

// POST /api/compras/ - Registrar una compra completa
router.post('/', registrarCompra);

export default router;
