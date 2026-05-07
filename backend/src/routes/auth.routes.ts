import { Router } from 'express';
import { login, registrarUsuario } from '../controllers/auth.controller.js';

const router = Router();

/**
 * POST /api/auth/login
 * Autentica un usuario
 * Body: { username: string, password: string }
 */
router.post('/login', login);

/**
 * POST /api/auth/registrar
 * Registra un nuevo usuario con contraseña encriptada
 * Body: { username: string, password: string, id_empleado: number }
 */
router.post('/registrar', registrarUsuario);

export default router;
