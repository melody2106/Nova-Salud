import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeStoredProcedure } from '../config/db.js';
import { sendSuccess, sendError, handleError } from '../utils/responses.js';
import { LoginRequest } from '../types/index.js';

/**
 * POST /api/auth/login
 * Autentica usuario con SP_Login + bcrypt + JWT
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      sendError(res, 'Username y password son requeridos', 400);
      return;
    }

    const results: any = await executeStoredProcedure('SP_Login', [username]);
    const user = results?.[0]?.[0];

    if (!user || !user.password_hash) {
      sendError(res, 'Usuario o contraseña incorrectos', 401);
      return;
    }

    const passwordMatch = await bcryptjs.compare(password, user.password_hash);
    if (!passwordMatch) {
      sendError(res, 'Usuario o contraseña incorrectos', 401);
      return;
    }

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        username: user.username,
        nombres: user.nombres,
        apellidos: user.apellidos,
        cargo: user.nombre_cargo,
      },
      process.env.JWT_SECRET || 'secret_fallback',
      { expiresIn: '8h' }
    );

    sendSuccess(
      res,
      {
        token,
        user: {
          id_usuario: user.id_usuario,
          username: user.username,
          nombres: user.nombres,
          apellidos: user.apellidos,
          nombre_cargo: user.nombre_cargo,
        },
      },
      'Login exitoso',
      200
    );
  } catch (error) {
    handleError(res, error, 'Error en el login');
  }
}

/**
 * POST /api/auth/register
 * Registro interno desde RRHH/Admin — crea Empleado + Usuario con cargo específico
 * Body: { username, password, nombres, apellidos, dni, id_cargo }
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, nombres, apellidos, dni, id_cargo } = req.body;

    if (!username || !password || !nombres || !apellidos || !dni || !id_cargo) {
      sendError(
        res,
        'Faltan datos obligatorios: username, password, nombres, apellidos, dni, id_cargo',
        400
      );
      return;
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const results: any = await executeStoredProcedure('SP_Empleado_Registrar_Con_Usuario', [
      nombres,
      apellidos,
      dni,
      Number(id_cargo),
      username,
      passwordHash,
    ]);

    const row = results?.[0]?.[0];
    if (row && row.resultado === 'ERROR') {
      sendError(res, row.mensaje || 'Error al registrar empleado', 400);
      return;
    }

    sendSuccess(res, { username, nombres, apellidos }, 'Empleado registrado con éxito', 201);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      sendError(res, 'El DNI o nombre de usuario ya existe', 409);
      return;
    }
    handleError(res, error, 'Error al registrar empleado');
  }
}

/**
 * POST /api/auth/registrar
 * Registro público — crea Empleado + Usuario con id_cargo fijo (no-admin)
 * NOTA: id_cargo se fija en 2 (Vendedor) para evitar crear administradores públicamente.
 * Body: { dni, nombres, apellidos, username, password }
 */
export async function registrarUsuario(req: Request, res: Response): Promise<void> {
  try {
    const { dni, nombres, apellidos, username, password } = req.body;

    if (!dni || !nombres || !apellidos || !username || !password) {
      sendError(res, 'Faltan datos: dni, nombres, apellidos, username, password', 400);
      return;
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    // Usamos SP_Registrar que internamente fija id_cargo seguro (Vendedor)
    const results: any = await executeStoredProcedure('SP_Registrar', [
      dni,
      nombres,
      apellidos,
      username,
      passwordHash,
    ]);

    const row = results?.[0]?.[0];
    if (!row || row.resultado === 'ERROR') {
      sendError(res, row?.mensaje || 'Error al registrar', 400);
      return;
    }

    sendSuccess(res, { username }, 'Usuario registrado exitosamente', 201);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      sendError(res, 'El DNI o username ya existe', 409);
      return;
    }
    handleError(res, error, 'Error al registrar usuario');
  }
}

/**
 * GET /api/auth/usuarios?busqueda=texto
 * Lista empleados con sus usuarios — SP_Usuario_Listar_Busqueda
 */
export async function listarUsuarios(req: Request, res: Response): Promise<void> {
  try {
    const busqueda = (req.query.busqueda as string) || '';
    const results: any = await executeStoredProcedure('SP_Usuario_Listar_Busqueda', [busqueda]);

    let rows: any[];
    if (Array.isArray(results?.[0])) {
      rows = results[0];
    } else if (Array.isArray(results)) {
      rows = results;
    } else {
      rows = [];
    }

    sendSuccess(res, rows, 'Usuarios listados correctamente');
  } catch (error) {
    handleError(res, error, 'Error al listar usuarios');
  }
}