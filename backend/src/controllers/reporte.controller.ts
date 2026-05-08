import { Request, Response } from 'express';
import { default as pool } from '../config/db.js';
import { sendSuccess, handleError } from '../utils/responses.js';

/**
 * GET /api/reportes/alertas
 * Obtiene alertas de inventario: lotes por vencer y productos con stock bajo
 */
export async function obtenerAlertas(req: Request, res: Response): Promise<void> {
  try {
    // 1. Lotes que vencen en menos de 3 meses (y tienen stock)
    const [lotes]: any = await pool.execute(`
      SELECT 
        p.nombre_comercial,
        l.codigo_lote,
        l.fecha_vencimiento,
        l.stock_actual_lote,
        l.id_producto
      FROM Lotes l
      INNER JOIN Productos p ON l.id_producto = p.id_producto
      WHERE l.fecha_vencimiento < DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
        AND l.stock_actual_lote > 0
      ORDER BY l.fecha_vencimiento ASC
    `);

    // 2. Productos con stock actual <= stock mínimo
    const [productos]: any = await pool.execute(`
      SELECT 
        id_producto,
        nombre_comercial,
        stock_actual_unidades,
        stock_minimo_unidades
      FROM Productos
      WHERE stock_actual_unidades <= stock_minimo_unidades
      ORDER BY stock_actual_unidades ASC
    `);

    sendSuccess(
      res,
      {
        lotesPorVencer: lotes,
        productosStockBajo: productos
      },
      'Alertas de inventario obtenidas exitosamente'
    );

  } catch (error) {
    console.error('Error en obtenerAlertas:', error);
    handleError(res, error, 'Error al obtener alertas de inventario');
  }
}
