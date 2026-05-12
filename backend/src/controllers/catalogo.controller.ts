import { Request, Response } from 'express';
import { default as pool } from '../config/db.js';
import { sendSuccess, sendError, handleError } from '../utils/responses.js';

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

/** Tablas maestras permitidas (whitelist para evitar SQL injection) */
const TABLAS_PERMITIDAS: Record<string, { tabla: string; id: string; nombre: string }> = {
  laboratorios: { tabla: 'Laboratorios', id: 'id_laboratorio', nombre: 'nombre_laboratorio' },
  categorias: { tabla: 'Categorias', id: 'id_categoria', nombre: 'nombre_categoria' },
  presentaciones: { tabla: 'Presentaciones', id: 'id_presentacion', nombre: 'nombre_presentacion' },
  cargos: { tabla: 'Cargos', id: 'id_cargo', nombre: 'nombre_cargo' },
  unidades: { tabla: 'Unidades_Medida', id: 'id_unidad', nombre: 'nombre_unidad' },
  vias: { tabla: 'Vias_Administracion', id: 'id_via', nombre: 'nombre_via' },
};

// ────────────────────────────────────────────────────────────────
// GET /api/catalogo/:tabla
// Devuelve todos los registros activos de una tabla maestra
// ────────────────────────────────────────────────────────────────
export async function listarCatalogo(req: Request, res: Response): Promise<void> {
  try {
    const { tabla } = req.params as { tabla: string };
    const config = TABLAS_PERMITIDAS[tabla];

    if (!config) {
      sendError(
        res,
        `Tabla desconocida. Valores válidos: ${Object.keys(TABLAS_PERMITIDAS).join(', ')}`,
        400
      );
      return;
    }

    const [rows]: any = await pool.execute(
      `SELECT ${config.id}, ${config.nombre} FROM ${config.tabla} ORDER BY ${config.nombre} ASC`
    );

    sendSuccess(res, rows, `${tabla} listados correctamente`);
  } catch (error) {
    handleError(res, error, 'Error al listar catálogo');
  }
}

// ────────────────────────────────────────────────────────────────
// POST /api/catalogo/:tabla
// Inserta un nuevo registro en la tabla maestra
// Body: { nombre }
// ────────────────────────────────────────────────────────────────
export async function crearEntradaCatalogo(req: Request, res: Response): Promise<void> {
  try {
    const { tabla } = req.params as { tabla: string };
    const config = TABLAS_PERMITIDAS[tabla];

    if (!config) {
      sendError(
        res,
        `Tabla desconocida. Valores válidos: ${Object.keys(TABLAS_PERMITIDAS).join(', ')}`,
        400
      );
      return;
    }

    const { nombre } = req.body;
    if (!nombre || String(nombre).trim().length === 0) {
      sendError(res, 'El campo "nombre" es requerido', 400);
      return;
    }

    const [result]: any = await pool.execute(
      `INSERT INTO ${config.tabla} (${config.nombre}) VALUES (?)`,
      [String(nombre).trim()]
    );

    sendSuccess(
      res,
      { id: result.insertId, nombre: String(nombre).trim() },
      `Registro creado en ${tabla}`,
      201
    );
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      sendError(res, 'Ya existe un registro con ese nombre', 409);
      return;
    }
    handleError(res, error, 'Error al crear entrada en catálogo');
  }
}

// ────────────────────────────────────────────────────────────────
// PUT /api/catalogo/:tabla/:id
// Actualiza el nombre de un registro
// Body: { nombre }
// ────────────────────────────────────────────────────────────────
export async function actualizarEntradaCatalogo(req: Request, res: Response): Promise<void> {
  try {
    const { tabla, id } = req.params as { tabla: string; id: string };
    const config = TABLAS_PERMITIDAS[tabla];

    if (!config) {
      sendError(res, `Tabla desconocida`, 400);
      return;
    }

    if (!id || isNaN(Number(id))) {
      sendError(res, 'ID inválido', 400);
      return;
    }

    const { nombre } = req.body;
    if (!nombre || String(nombre).trim().length === 0) {
      sendError(res, 'El campo "nombre" es requerido', 400);
      return;
    }

    const [result]: any = await pool.execute(
      `UPDATE ${config.tabla} SET ${config.nombre} = ? WHERE ${config.id} = ?`,
      [String(nombre).trim(), Number(id)]
    );

    if (result.affectedRows === 0) {
      sendError(res, 'Registro no encontrado', 404);
      return;
    }

    sendSuccess(res, { id: Number(id), nombre: String(nombre).trim() }, 'Registro actualizado');
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      sendError(res, 'Ya existe un registro con ese nombre', 409);
      return;
    }
    handleError(res, error, 'Error al actualizar entrada en catálogo');
  }
}

// ────────────────────────────────────────────────────────────────
// DELETE /api/catalogo/:tabla/:id
// Elimina un registro (si no tiene dependencias)
// ────────────────────────────────────────────────────────────────
export async function eliminarEntradaCatalogo(req: Request, res: Response): Promise<void> {
  try {
    const { tabla, id } = req.params as { tabla: string; id: string };
    const config = TABLAS_PERMITIDAS[tabla];

    if (!config) {
      sendError(res, 'Tabla desconocida', 400);
      return;
    }

    if (!id || isNaN(Number(id))) {
      sendError(res, 'ID inválido', 400);
      return;
    }

    const [result]: any = await pool.execute(
      `DELETE FROM ${config.tabla} WHERE ${config.id} = ?`,
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      sendError(res, 'Registro no encontrado', 404);
      return;
    }

    sendSuccess(res, null, 'Registro eliminado correctamente');
  } catch (error: any) {
    if (
      error.code === 'ER_ROW_IS_REFERENCED' ||
      error.code === 'ER_ROW_IS_REFERENCED_2'
    ) {
      sendError(
        res,
        'No se puede eliminar — el registro está siendo usado por otros datos',
        409
      );
      return;
    }
    handleError(res, error, 'Error al eliminar entrada en catálogo');
  }
}