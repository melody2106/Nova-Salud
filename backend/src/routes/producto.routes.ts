import { Router } from 'express';
import { listarProductos, obtenerPreciosProducto } from '../controllers/producto.controller.js';

const router = Router();

/**
 * GET /api/producto/listar
 * Obtiene el listado completo de productos
 */
router.get('/listar', listarProductos);

/**
 * GET /api/producto/:id_producto/precios
 * Obtiene los precios disponibles de un producto específico
 */
router.get('/:id_producto/precios', obtenerPreciosProducto);

export default router;
