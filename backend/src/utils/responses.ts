import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Operación exitosa',
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = { success: true, data, message };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  error?: any
): void {
  const response: ApiResponse<null> = {
    success: false,
    message,
    error: error?.message || error,
  };
  res.status(statusCode).json(response);
}

export function handleError(
  res: Response,
  error: any,
  defaultMessage: string = 'Error en el servidor'
): void {
  console.error(defaultMessage, error);
  if (error.code === 'ER_DUP_ENTRY') {
    sendError(res, 'El registro ya existe', 409, error);
  } else if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === 'ER_NO_REFERENCED_ROW_2') {
    sendError(res, 'Referencia de datos inválida — verifica los IDs enviados', 400, error);
  } else if (error.message?.includes('PROCEDURE')) {
    sendError(res, 'Error al ejecutar procedimiento almacenado', 500, error);
  } else {
    sendError(res, defaultMessage, 500, error);
  }
}