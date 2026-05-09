import { Router } from 'express';
import { listarProductos, obtenerPreciosProducto, registrarProducto } from '../controllers/producto.controller.js';

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

/**
 * POST /api/producto/registrar
 * Registra un nuevo producto usando SP_Producto_Registrar
 */
router.post('/registrar', registrarProducto);

export default router;
