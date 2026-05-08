import { Request, Response } from 'express';
import { executeStoredProcedure, default as pool } from '../config/db.js';
import { sendSuccess, sendError, handleError } from '../utils/responses.js';

/**
 * POST /api/compras/
 * Registra una compra completa (Cabecera, Lotes, Detalles) y actualiza inventario
 */
export async function registrarCompra(req: Request, res: Response): Promise<void> {
  let connection;
  
  try {
    const { id_laboratorio, id_usuario, numero_factura_compra, total_compra, detalles } = req.body;

    // 1. Validar entrada
    if (!id_laboratorio || !id_usuario || !numero_factura_compra || !total_compra || !detalles || !Array.isArray(detalles)) {
      sendError(res, 'Faltan datos obligatorios: id_laboratorio, id_usuario, numero_factura_compra, total_compra, detalles', 400);
      return;
    }

    if (detalles.length === 0) {
      sendError(res, 'La compra debe tener al menos un detalle', 400);
      return;
    }

    // 2. Obtener conexión y empezar transacción
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 3. Llamar a SP_Compra_Crear para crear la cabecera
    const [compraResult]: any = await connection.execute(
      'CALL SP_Compra_Crear(?, ?, ?, ?)',
      [id_laboratorio, id_usuario, numero_factura_compra, total_compra]
    );

    // El SP devuelve el id_compra_generada
    const id_compra = compraResult?.[0]?.[0]?.id_compra_generada;

    if (!id_compra) {
      throw new Error('No se pudo obtener el ID de la compra generada');
    }

    // 4. Iterar sobre los detalles
    for (const detalle of detalles) {
      const { id_producto, codigo_lote, fecha_vencimiento, cantidad, precio_unitario } = detalle;

      if (!id_producto || !codigo_lote || !fecha_vencimiento || !cantidad || !precio_unitario) {
        throw new Error('Cada detalle debe tener: id_producto, codigo_lote, fecha_vencimiento, cantidad, precio_unitario');
      }

      // 4.1. Insertar el nuevo Lote
      const [loteResult]: any = await connection.execute(
        'INSERT INTO Lotes (id_producto, codigo_lote, fecha_vencimiento, stock_inicial, stock_actual_lote) VALUES (?, ?, ?, ?, ?)',
        [id_producto, codigo_lote, fecha_vencimiento, cantidad, cantidad]
      );

      const id_lote = loteResult.insertId;

      if (!id_lote) {
        throw new Error('No se pudo insertar el lote');
      }

      // 4.2. Insertar en Detalle_Compras (incluyendo el id_lote)
      const subtotal = cantidad * precio_unitario;
      await connection.execute(
        'INSERT INTO Detalle_Compras (id_compra, id_producto, id_lote, cantidad_comprada, precio_unitario_compra, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [id_compra, id_producto, id_lote, cantidad, precio_unitario, subtotal]
      );

      // 4.3. AUMENTAR el stock en la tabla Productos
      await connection.execute(
        'UPDATE Productos SET stock_actual_unidades = stock_actual_unidades + ? WHERE id_producto = ?',
        [cantidad, id_producto]
      );
    }

    // 5. Commit de la transacción
    await connection.commit();

    sendSuccess(
      res,
      { id_compra },
      'Compra registrada exitosamente y stock actualizado',
      201
    );

  } catch (error: any) {
    // Rollback en caso de error
    if (connection) {
      await connection.rollback();
    }

    console.error('Error en registrarCompra:', error);
    handleError(res, error, 'Error al registrar la compra');
  } finally {
    // Liberar conexión
    if (connection) {
      connection.release();
    }
  }
}
