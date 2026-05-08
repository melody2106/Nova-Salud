import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool, { executeStoredProcedure } from '../config/db.js';
import { sendSuccess, sendError, handleError } from '../utils/responses.js';
import { LoginRequest } from '../types/index.js';

/**
 * POST /api/auth/login
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
 * Registra un nuevo usuario junto con el empleado asociado
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, nombres, apellidos, dni, id_cargo } = req.body;

    if (!username || !password || !nombres || !apellidos || !dni || !id_cargo) {
      sendError(res, 'Faltan datos obligatorios: username, password, nombres, apellidos, dni, id_cargo', 400);
      return;
    }

    const passwordHash = await bcryptjs.hash(password, 10);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [empleadoResult]: any = await connection.execute(
        'INSERT INTO Empleados (nombres, apellidos, dni, id_cargo) VALUES (?, ?, ?, ?)',
        [nombres, apellidos, dni, id_cargo]
      );

      const id_empleado = empleadoResult.insertId;

      await connection.execute(
        'INSERT INTO Usuarios (username, password_hash, id_empleado) VALUES (?, ?, ?)',
        [username, passwordHash, id_empleado]
      );

      await connection.commit();
      res.status(201).json({ success: true, message: 'Usuario registrado con éxito' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      sendError(res, 'El nombre de usuario ya existe', 400);
      return;
    }
    handleError(res, error, 'Error al registrar usuario');
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
      sendError(res, 'El DNI o username ya existe', 400);
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
      sendError(res, 'El username ya existe', 400);
      return;
    }
    handleError(res, error, 'Error al crear usuario');
  }
}