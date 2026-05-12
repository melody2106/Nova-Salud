import { Router } from 'express';
import {
  listarCatalogo,
  crearEntradaCatalogo,
  actualizarEntradaCatalogo,
  eliminarEntradaCatalogo,
} from '../controllers/catalogo.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * GET  /api/catalogo/:tabla        — cualquier usuario autenticado
 * POST /api/catalogo/:tabla        — solo Administrador
 * PUT  /api/catalogo/:tabla/:id    — solo Administrador
 * DELETE /api/catalogo/:tabla/:id  — solo Administrador
 *
 * :tabla puede ser: laboratorios | categorias | presentaciones | cargos | unidades | vias
 */
router.get('/:tabla', verifyToken, listarCatalogo);
router.post('/:tabla', verifyToken, requireRole('Administrador'), crearEntradaCatalogo);
router.put('/:tabla/:id', verifyToken, requireRole('Administrador'), actualizarEntradaCatalogo);
router.delete('/:tabla/:id', verifyToken, requireRole('Administrador'), eliminarEntradaCatalogo);

export default router;