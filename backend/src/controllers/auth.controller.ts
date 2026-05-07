import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeStoredProcedure } from '../config/db.js';
import { sendSuccess, sendError, handleError } from '../utils/responses.js';
import { LoginRequest } from '../types/index.js';

/**
 * POST /api/auth/login
 * Autentica un usuario usando el SP_Login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password }: LoginRequest = req.body;

    // 1. Validar entrada
    if (!username || !password) {
      sendError(res, 'Username y password son requeridos', 400);
      return;
    }

    // 2. Ejecutar SP_Login para obtener usuario
    const results: any = await executeStoredProcedure('SP_Login', [username]);

    // results = [ [filas], metadata ] → usuario está en results[0][0]
    const user = results?.[0]?.[0];

    // 3. Verificar si el usuario existe y si se recuperó el hash
    if (!user || !user.password_hash) {
      sendError(res, 'Usuario o contraseña incorrectos', 401);
      return;
    }

    // 4. Comparar contraseña enviada con el hash de la BD
    const passwordMatch = await bcryptjs.compare(password, user.password_hash);

    if (!passwordMatch) {
      sendError(res, 'Usuario o contraseña incorrectos', 401);
      return;
    }

    // 5. Generar JWT Token (válido por 8 horas)
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

    // 6. Devolver respuesta exitosa con los datos del usuario
    sendSuccess(
      res,
      {
        token,
        user: {
          id_usuario: user.id_usuario,
          username: user.username,
          nombres: user.nombres,
          apellidos: user.apellidos,
          cargo: user.nombre_cargo,
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
 * POST /api/auth/registrar
 * Registra un nuevo usuario con contraseña encriptada
 */
export async function registrarUsuario(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, id_empleado } = req.body;

    // Validar entrada
    if (!username || !password || !id_empleado) {
      sendError(res, 'Faltan datos obligatorios: username, password, id_empleado', 400);
      return;
    }

    // 🔒 Encriptar la contraseña (Hashing)
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Llamar al procedimiento almacenado para insertar
    await executeStoredProcedure('SP_Usuario_Crear', [username, passwordHash, id_empleado]);

    // Respuesta exitosa
    sendSuccess(
      res,
      { username, id_empleado },
      'Usuario registrado exitosamente con seguridad activa',
      201
    );
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      sendError(res, 'El nombre de usuario ya existe', 400);
      return;
    }
    handleError(res, error, 'Error al registrar usuario');
  }
}