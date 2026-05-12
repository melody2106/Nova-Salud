import { Router } from 'express';
import {
  buscarClientePorDni,
  obtenerClienteGenerico,
} from '../controllers/cliente.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/** GET /api/clientes/generico — devuelve el cliente genérico */
router.get('/generico', verifyToken, obtenerClienteGenerico);

/** GET /api/clientes/buscar/:dni — busca cliente por DNI */
router.get('/buscar/:dni', verifyToken, buscarClientePorDni);

export default router;