import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import { executeStoredProcedure } from '../config/db.js';
import { sendSuccess, sendError, handleError } from '../utils/responses.js';

/**
 * GET /api/empleados/buscar/:dni
 * Busca un empleado por DNI usando SP_Empleado_BuscarDNI.
 * Normaliza el wrapper de MySQL2: CALL devuelve [[filas], OkPacket].
 */
export async function buscarEmpleadoPorDni(req: Request, res: Response): Promise<void> {
  try {
    const { dni } = req.params;

    if (!dni || dni.trim().length === 0) {
      sendError(res, 'El DNI es requerido', 400);
      return;
    }

    const results: any = await executeStoredProcedure('SP_Empleado_BuscarDNI', [dni.trim()]);

    // Normalizar: CALL MySQL2 → [[filas], OkPacket]
    const empleado = results?.[0]?.[0];

    if (!empleado) {
      sendError(res, 'No se encontró un empleado con ese DNI', 404);
      return;
    }

    sendSuccess(res, empleado, 'Empleado encontrado');
  } catch (error) {
    handleError(res, error, 'Error al buscar empleado por DNI');
  }
}

/**
 * POST /api/auth/crear-credencial
 * Crea usuario + contraseña para un empleado ya existente.
 * Encripta la contraseña con bcrypt antes de llamar al SP.
 * Body: { id_empleado, username, password }
 */
export async function crearCredencial(req: Request, res: Response): Promise<void> {
  try {
    const { id_empleado, username, password } = req.body;

    if (!id_empleado || !username || !password) {
      sendError(res, 'Faltan datos: id_empleado, username, password', 400);
      return;
    }

    const password_hash = await bcryptjs.hash(password, 10);

    const results: any = await executeStoredProcedure('SP_Usuario_Crear_Credencial', [
      Number(id_empleado),
      username,
      password_hash,
    ]);

    // Normalizar wrapper
    const row = results?.[0]?.[0];

    if (row?.resultado === 'ERROR') {
      sendError(res, row.mensaje || 'Error al crear credencial', 400);
      return;
    }

    sendSuccess(res, { username, id_empleado }, 'Credenciales creadas exitosamente', 201);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      sendError(res, 'El nombre de usuario ya está en uso', 409);
      return;
    }
    handleError(res, error, 'Error al crear credencial');
  }
}
