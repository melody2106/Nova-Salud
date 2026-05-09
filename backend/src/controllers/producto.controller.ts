import { Request, Response } from 'express';
import { executeStoredProcedure } from '../config/db.js';
import { sendSuccess, sendError, handleError } from '../utils/responses.js';
import { ProductoListar, ProductoPrecio } from '../types/index.js';

/**
 * GET /producto/listar
 * Obtiene el listado completo de productos usando SP_Producto_Listar
 */
export async function listarProductos(req: Request, res: Response): Promise<void> {
  try {
    // Ejecutar SP sin parámetros
    const resultados = await executeStoredProcedure('SP_Producto_Listar', []);

    if (!resultados || resultados.length === 0) {
      sendSuccess(res, [], 'No hay productos registrados', 200);
      return;
    }

    const productos: ProductoListar[] = resultados;

    sendSuccess(res, productos, 'Productos listados exitosamente', 200);
  } catch (error) {
    handleError(res, error, 'Error al listar productos');
  }
}

/**
 * GET /producto/:id_producto/precios
 * Obtiene los precios disponibles de un producto usando SP_Producto_Precios
 */
export async function obtenerPreciosProducto(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id_producto } = req.params;
    const idProducto = Array.isArray(id_producto) ? id_producto[0] : id_producto;

    // Validar parámetro
    if (!idProducto || isNaN(Number(idProducto))) {
      sendError(res, 'El ID del producto es inválido', 400);
      return;
    }

    // Ejecutar SP
    const resultados = await executeStoredProcedure('SP_Producto_Precios', [
      parseInt(idProducto),
    ]);

    if (!resultados || resultados.length === 0) {
      sendSuccess(res, [], 'No hay precios registrados para este producto', 200);
      return;
    }

    const precios: ProductoPrecio[] = resultados;

    sendSuccess(res, precios, 'Precios obtenidos exitosamente', 200);
  } catch (error) {
    handleError(res, error, 'Error al obtener precios');
  }
}

/**
 * POST /api/producto/registrar
 * Registra un nuevo producto usando SP_Producto_Registrar.
 * Body: { id_laboratorio, id_categoria, id_presentacion, nombre_comercial, principio_activo, stock_minimo }
 */
export async function registrarProducto(req: Request, res: Response): Promise<void> {
  try {
    const { id_laboratorio, id_categoria, id_presentacion, nombre_comercial, principio_activo, stock_minimo } = req.body;

    if (!id_laboratorio || !id_categoria || !id_presentacion || !nombre_comercial) {
      sendError(res, 'Faltan datos obligatorios: id_laboratorio, id_categoria, id_presentacion, nombre_comercial', 400);
      return;
    }

    const results: any = await executeStoredProcedure('SP_Producto_Registrar', [
      Number(id_laboratorio),
      Number(id_categoria),
      Number(id_presentacion),
      nombre_comercial,
      principio_activo ?? null,
      Number(stock_minimo ?? 10),
    ]);

    // Normalizar wrapper de MySQL2: CALL devuelve [[filas], OkPacket]
    const row = results?.[0]?.[0];

    if (row?.resultado === 'ERROR') {
      sendError(res, row.mensaje || 'Error al registrar producto', 400);
      return;
    }

    sendSuccess(res, { nombre_comercial }, 'Producto registrado exitosamente', 201);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      sendError(res, 'Ya existe un producto con ese nombre', 409);
      return;
    }
    handleError(res, error, 'Error al registrar producto');
  }
}
