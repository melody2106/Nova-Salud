import { Router } from 'express';
import {
  listarProductos,
  obtenerPreciosProducto,
  registrarProducto,
} from '../controllers/producto.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

/** GET /api/producto/listar — Administrador, Vendedor, Almacenero */
router.get('/listar', verifyToken, listarProductos);

/** GET /api/producto/:id_producto/precios — cualquier usuario autenticado */
router.get('/:id_producto/precios', verifyToken, obtenerPreciosProducto);

/** POST /api/producto/registrar — solo Administrador y Almacenero */
router.post(
  '/registrar',
  verifyToken,
  requireRole('Administrador', 'Almacenero'),
  registrarProducto
);

export default router;