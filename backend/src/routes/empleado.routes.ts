import { Router } from 'express';
import { buscarEmpleadoPorDni } from '../controllers/empleado.controller.js';

const router = Router();

/**
 * GET /api/empleados/buscar/:dni
 * Busca un empleado por su DNI usando SP_Empleado_BuscarDNI
 */
router.get('/buscar/:dni', buscarEmpleadoPorDni);

export default router;
