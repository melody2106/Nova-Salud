import { Router } from 'express';
import { login, registrarUsuario, register, listarUsuarios } from '../controllers/auth.controller.js';
import { crearCredencial } from '../controllers/empleado.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// ── Rutas PÚBLICAS (sin autenticación) ──────────────────────────

/** POST /api/auth/login */
router.post('/login', login);

/** POST /api/auth/registrar — registro público, crea usuario con rol Vendedor */
router.post('/registrar', registrarUsuario);

// ── Rutas PROTEGIDAS (requieren JWT) ────────────────────────────

/**
 * POST /api/auth/register
 * Registro interno desde RRHH — solo Administrador
 */
router.post('/register', verifyToken, requireRole('Administrador'), register);

/**
 * GET /api/auth/usuarios?busqueda=texto
 * Lista empleados + usuarios — solo Administrador
 */
router.get('/usuarios', verifyToken, requireRole('Administrador'), listarUsuarios);

/**
 * POST /api/auth/crear-credencial
 * Crea username+password para empleado ya existente — solo Administrador
 */
router.post('/crear-credencial', verifyToken, requireRole('Administrador'), crearCredencial);

export default router;