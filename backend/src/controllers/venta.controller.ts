import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeStoredProcedure, default as pool } from '../config/db.js';
import { sendSuccess, sendError, handleError } from '../utils/responses.js';
import { LoginRequest, VentaCrear } from '../types/index.js';

/**
 * POST /api/ventas/
 * Registra una venta completa (Cabecera + Detalles) usando transacciones y Stored Procedures
 */
export async function registrarVenta(req: Request, res: Response): Promise<void> {
  let connection;

  try {
    const { id_tipo_comprobante, id_cliente, id_usuario, total, metodo_pago, detalles } = req.body;

    // 1. Validaciones iniciales
    if (!id_tipo_comprobante || !id_cliente || !id_usuario || !total || !detalles || !Array.isArray(detalles)) {
      res.status(400).json({ 
        success: false, 
        message: 'Faltan datos obligatorios: id_tipo_comprobante, id_cliente, id_usuario, total, detalles' 
      });
      return;
    }

    if (detalles.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'La venta debe tener al menos un detalle' 
      });
      return;
    }

    // 2. Iniciar la transacción de base de datos
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 3. Crear la cabecera de la venta
    const [result]: any = await connection.execute(
      'CALL SP_Venta_Crear(?, ?, ?, ?)',
      [id_tipo_comprobante, id_cliente, id_usuario, total]
    );

    // 4. Extracción segura del ID generado por mysql2
    const id_venta = result[0]?.[0]?.id_venta_generada || result?.[0]?.[0]?.[0]?.id_venta_generada;

    if (!id_venta) {
      throw new Error('No se generó el ID de venta en la base de datos');
    }

    // 5. Registrar los detalles usando el nuevo Procedimiento Almacenado
    for (const detalle of detalles) {
      const { id_producto, id_producto_precio, cantidad, precio_unitario, subtotal } = detalle;

      if (!id_producto || !cantidad || !precio_unitario || !subtotal) {
        throw new Error('Cada detalle debe contener id_producto, cantidad, precio_unitario y subtotal');
      }

      // Reemplazamos los INSERT y UPDATE manuales por el CALL al SP
      await connection.execute(
        'CALL SP_Venta_Detalle_Crear(?, ?, ?, ?, ?, ?)',
        [id_venta, id_producto, id_producto_precio, cantidad, precio_unitario, subtotal]
      );
    }

    // 6. Confirmar los cambios si todo salió bien
    await connection.commit();

    res.status(201).json({ 
      success: true, 
      message: 'Venta registrada exitosamente', 
      data: { id_venta } 
    });

  } catch (error: any) {
    // Si algo falla, revertimos todos los cambios (Rollback)
    if (connection) {
      await connection.rollback();
    }

    // Imprimir el error real en la terminal para depuración
    console.error('🔥 ERROR REAL SQL:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Error interno al procesar la venta',
      error: error.message 
    });

  } finally {
    // Liberar la conexión para no saturar el servidor
    if (connection) {
      connection.release();
    }
  }
}