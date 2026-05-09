import { Router } from 'express';
import { login, registrarUsuario, crearUsuario, register, listarUsuarios } from '../controllers/auth.controller.js';
import { crearCredencial } from '../controllers/empleado.controller.js';

const router = Router();

/**
 * POST /api/auth/login
 * Autentica un usuario con SP_Login + bcrypt + JWT
 * Body: { username: string, password: string }
 */
router.post('/login', login);

/**
 * POST /api/auth/register
 * Registro interno desde RRHH/Admin — crea Empleado + Usuario via SP
 * Body: { username, password, nombres, apellidos, dni, id_cargo }
 */
router.post('/register', register);

/**
 * POST /api/auth/registrar
 * Registro público (antes del login) — SP_Registrar con id_cargo=1
 * Body: { dni, nombres, apellidos, username, password }
 */
router.post('/registrar', registrarUsuario);

/**
 * POST /api/auth/crear-usuario
 * Crea credenciales para un empleado ya existente — SP_Usuario_Crear
 * Body: { username, password, id_empleado }
 */
router.post('/crear-usuario', crearUsuario);

/**
 * GET /api/auth/usuarios?busqueda=texto
 * Lista empleados + usuarios del sistema — SP_Usuario_Listar_Busqueda
 * Si busqueda está vacío, devuelve todos.
 */
router.get('/usuarios', listarUsuarios);

/**
 * POST /api/auth/crear-credencial
 * Crea username + password para un empleado ya existente — SP_Usuario_Crear_Credencial
 * Body: { id_empleado, username, password }
 */
router.post('/crear-credencial', crearCredencial);

export default router;
