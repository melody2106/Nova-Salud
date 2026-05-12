import { Request, Response } from 'express';
import { default as pool } from '../config/db.js';
import { sendSuccess, sendError, handleError } from '../utils/responses.js';

/**
 * GET /api/clientes/buscar/:dni
 * Busca un cliente por DNI en la tabla Clientes
 */
export async function buscarClientePorDni(req: Request, res: Response): Promise<void> {
  try {
    const { dni } = req.params as { dni: string };

    if (!dni || dni.trim().length === 0) {
      sendError(res, 'El DNI es requerido', 400);
      return;
    }

    const [rows]: any = await pool.execute(
      `SELECT id_cliente, nombres, apellidos, dni, telefono
       FROM clientes
       WHERE dni = ?
       LIMIT 1`,
      [dni.trim()]
    );

    if (!rows || rows.length === 0) {
      sendError(res, 'No se encontró un cliente con ese DNI', 404);
      return;
    }

    sendSuccess(res, rows[0], 'Cliente encontrado');
  } catch (error) {
    handleError(res, error, 'Error al buscar cliente por DNI');
  }
}

/**
 * GET /api/clientes/generico
 * Devuelve el cliente genérico "Público en General" (id_cliente=1)
 */
export async function obtenerClienteGenerico(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.execute(
      `SELECT id_cliente, nombres, apellidos, dni FROM Clientes WHERE id_cliente = 1 LIMIT 1`
    );

    if (!rows || rows.length === 0) {
      sendSuccess(
        res,
        { id_cliente: 1, nombres: 'PÚBLICO', apellidos: 'EN GENERAL', dni: '00000000' },
        'Cliente genérico'
      );
      return;
    }

    sendSuccess(res, rows[0], 'Cliente genérico obtenido');
  } catch (error) {
    handleError(res, error, 'Error al obtener cliente genérico');
  }
}