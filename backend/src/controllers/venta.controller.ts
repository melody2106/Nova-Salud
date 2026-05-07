import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeStoredProcedure, default as pool } from '../config/db.js';
import { sendSuccess, sendError, handleError } from '../utils/responses.js';
import { LoginRequest, VentaCrear } from '../types/index.js';

/**
 * POST /api/ventas/
 * Registra una venta completa (Cabecera + Detalles) usando transacciones
 */
export async function registrarVenta(req: Request, res: Response): Promise<void> {
  let connection;
  
  try {
    const { id_tipo_comprobante, id_cliente, id_usuario, total, detalles } = req.body;

    // 1. Validar entrada
    if (!id_tipo_comprobante || !id_cliente || !id_usuario || !total || !detalles || !Array.isArray(detalles)) {
      sendError(res, 'Faltan datos obligatorios: id_tipo_comprobante, id_cliente, id_usuario, total, detalles', 400);
      return;
    }

    if (detalles.length === 0) {
      sendError(res, 'La venta debe tener al menos un detalle', 400);
      return;
    }

    // 2. Obtener conexión y empezar transacción
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 3. Llamar a SP_Venta_Crear para crear la cabecera
    const [ventaResult]: any = await connection.execute(
      'CALL SP_Venta_Crear(?, ?, ?, ?)',
      [id_tipo_comprobante, id_cliente, id_usuario, total]
    );

    // El SP devuelve el id_venta_generada
    const id_venta = ventaResult?.[0]?.[0]?.id_venta_generada;

    if (!id_venta) {
      throw new Error('No se pudo obtener el ID de la venta generada');
    }

    // 4. Iterar sobre los detalles e insertar en Detalle_Ventas
    for (const detalle of detalles) {
      const { id_producto, id_producto_precio, cantidad, precio_unitario, subtotal } = detalle;

      if (!id_producto || !cantidad || !precio_unitario || !subtotal) {
        throw new Error('Cada detalle debe tener id_producto, cantidad, precio_unitario y subtotal');
      }

      // Insertar detalle de venta
      await connection.execute(
        'INSERT INTO Detalle_Ventas (id_venta, id_producto, id_producto_precio, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [id_venta, id_producto, id_producto_precio || null, cantidad, precio_unitario, subtotal]
      );

      // 5. Lógica FIFO: Descontar stock de lotes ordenados por fecha de vencimiento
      let cantidadPendiente = cantidad;

      // Obtener lotes con stock disponible, ordenados por fecha de vencimiento (FIFO)
      const [lotes]: any = await connection.execute(
        'SELECT id_lote, stock_actual_lote FROM Lotes WHERE id_producto = ? AND stock_actual_lote > 0 ORDER BY fecha_vencimiento ASC',
        [id_producto]
      );

      if (!lotes || lotes.length === 0) {
        throw new Error(`No hay lotes disponibles para el producto ${id_producto}`);
      }

      // Iterar sobre los lotes para descontar stock
      for (const lote of lotes) {
        if (cantidadPendiente <= 0) break;

        if (lote.stock_actual_lote >= cantidadPendiente) {
          // El lote tiene suficiente stock
          await connection.execute(
            'UPDATE Lotes SET stock_actual_lote = stock_actual_lote - ? WHERE id_lote = ?',
            [cantidadPendiente, lote.id_lote]
          );
          cantidadPendiente = 0;
        } else {
          // El lote no tiene suficiente, agotarlo y continuar con el siguiente
          cantidadPendiente -= lote.stock_actual_lote;
          await connection.execute(
            'UPDATE Lotes SET stock_actual_lote = 0 WHERE id_lote = ?',
            [lote.id_lote]
          );
        }
      }

      // Validar si se cubrió toda la cantidad vendida
      if (cantidadPendiente > 0) {
        throw new Error(`Stock insuficiente en lotes para el producto ${id_producto}. Faltan ${cantidadPendiente} unidades`);
      }

      // 6. Actualizar stock global del producto (mantener sincronizado)
      const [updateResult]: any = await connection.execute(
        'UPDATE Productos SET stock_actual_unidades = stock_actual_unidades - ? WHERE id_producto = ?',
        [cantidad, id_producto]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error(`No se encontró el producto con ID ${id_producto}`);
      }
    }

    // 6. Commit de la transacción
    await connection.commit();

    sendSuccess(
      res,
      { id_venta },
      'Venta registrada exitosamente',
      201
    );

  } catch (error: any) {
    // Rollback en caso de error
    if (connection) {
      await connection.rollback();
    }

    console.error('Error en registrarVenta:', error);
    handleError(res, error, 'Error al registrar la venta');
  } finally {
    // Liberar conexión
    if (connection) {
      connection.release();
    }
  }
}
