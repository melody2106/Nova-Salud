import { Request, Response } from 'express';
import { default as pool } from '../config/db.js';
import { sendError, handleError } from '../utils/responses.js';

/**
 * POST /api/ventas/
 * Registra una venta completa (Cabecera + Detalles) con transacción
 * Body: { id_tipo_comprobante, id_cliente, id_usuario, total, metodo_pago, detalles[] }
 */
export async function registrarVenta(req: Request, res: Response): Promise<void> {
  let connection;

  try {
    const { id_tipo_comprobante, id_cliente, id_usuario, total, metodo_pago, detalles } =
      req.body;

    if (
      !id_tipo_comprobante ||
      !id_cliente ||
      !id_usuario ||
      !total ||
      !detalles ||
      !Array.isArray(detalles)
    ) {
      sendError(
        res,
        'Faltan datos obligatorios: id_tipo_comprobante, id_cliente, id_usuario, total, detalles',
        400
      );
      return;
    }

    if (detalles.length === 0) {
      sendError(res, 'La venta debe tener al menos un detalle', 400);
      return;
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Crear cabecera de la venta
    const [result]: any = await connection.execute(
      'CALL SP_Venta_Crear(?, ?, ?, ?, ?)',
      [id_tipo_comprobante, id_cliente, id_usuario, total, metodo_pago || 'efectivo']
    );

    const id_venta =
      result[0]?.[0]?.id_venta_generada || result?.[0]?.[0]?.[0]?.id_venta_generada;

    if (!id_venta) {
      throw new Error('No se generó el ID de venta en la base de datos');
    }

    // Registrar detalles
    for (const detalle of detalles) {
      const { id_producto, id_producto_precio, cantidad, precio_unitario, subtotal } = detalle;

      if (!id_producto || !cantidad || !precio_unitario || !subtotal) {
        throw new Error(
          'Cada detalle debe contener id_producto, cantidad, precio_unitario y subtotal'
        );
      }

      await connection.execute(
        'CALL SP_Venta_Detalle_Crear(?, ?, ?, ?, ?, ?)',
        [id_venta, id_producto, id_producto_precio ?? null, cantidad, precio_unitario, subtotal]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      data: { id_venta },
    });
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('🔥 ERROR en registrarVenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al procesar la venta',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
}