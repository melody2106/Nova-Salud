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

    sendSuccess(res, {
      token,
      user: {
        id_usuario: user.id_usuario,
        username: user.username,
        nombres: user.nombres,
        apellidos: user.apellidos,
        cargo: user.nombre_cargo,
      },
    }, 'Login exitoso', 200);

  } catch (error) {
    handleError(res, error, 'Error en el login');
  }
}

/**
 * POST /api/auth/register
 * Registro interno desde RRHH/Admin — crea Empleado + Usuario con el cargo indicado.
 * Usa SP_Empleado_Registrar_Con_Usuario (100% Stored Procedures).
 * Body: { username, password, nombres, apellidos, dni, id_cargo }
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, nombres, apellidos, dni, id_cargo } = req.body;

    if (!username || !password || !nombres || !apellidos || !dni || !id_cargo) {
      sendError(res, 'Faltan datos obligatorios: username, password, nombres, apellidos, dni, id_cargo', 400);
      return;
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    // SP_Empleado_Registrar_Con_Usuario(p_nombres, p_apellidos, p_dni, p_id_cargo, p_username, p_password_hash)
    const results: any = await executeStoredProcedure('SP_Empleado_Registrar_Con_Usuario', [
      nombres,
      apellidos,
      dni,
      Number(id_cargo),
      username,
      passwordHash,
    ]);

    // El SP puede devolver { resultado: 'OK'|'ERROR', mensaje: string }
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
 * Registro público ANTES del login — crea Registro + Empleado + Usuario con id_cargo=1
 */
export async function registrarUsuario(req: Request, res: Response): Promise<void> {
  try {
    const { dni, nombres, apellidos, username, password } = req.body;

    if (!dni || !nombres || !apellidos || !username || !password) {
      sendError(res, 'Faltan datos: dni, nombres, apellidos, username, password', 400);
      return;
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    const results: any = await executeStoredProcedure('SP_Registrar', [
      dni, nombres, apellidos, username, passwordHash
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
 * POST /api/auth/crear-usuario
 * Registro INTERNO desde el sistema (RRHH/Admin) — requiere id_empleado ya existente
 */
export async function crearUsuario(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, id_empleado } = req.body;

    if (!username || !password || !id_empleado) {
      sendError(res, 'Faltan datos: username, password, id_empleado', 400);
      return;
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    await executeStoredProcedure('SP_Usuario_Crear', [username, passwordHash, id_empleado]);

    sendSuccess(res, { username, id_empleado }, 'Usuario creado exitosamente', 201);

  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      sendError(res, 'El username ya existe', 409);
      return;
    }
    handleError(res, error, 'Error al crear usuario');
  }
}

/**
 * GET /api/auth/usuarios?busqueda=texto
 * Lista empleados con sus usuarios del sistema usando SP_Usuario_Listar_Busqueda.
 * Normaliza el wrapper anidado que puede devolver MySQL2 con CALL.
 */
export async function listarUsuarios(req: Request, res: Response): Promise<void> {
  try {
    const busqueda = (req.query.busqueda as string) || '';

    const results: any = await executeStoredProcedure('SP_Usuario_Listar_Busqueda', [busqueda]);

    // MySQL2 con CALL devuelve: [[filas], OkPacket] → normalizar
    let rows: any[];
    if (Array.isArray(results?.[0])) {
      rows = results[0]; // forma anidada: results = [[{...}], OkPacket]
    } else if (Array.isArray(results)) {
      rows = results;    // forma plana: results = [{...}]
    } else {
      rows = [];
    }

    sendSuccess(res, rows, 'Usuarios listados correctamente');
  } catch (error) {
    handleError(res, error, 'Error al listar usuarios');
  }
}