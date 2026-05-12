/**
 * src/services/api.ts
 * Instancia Axios centralizada + funciones de servicio para todos los endpoints.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ApiResponse,
  Producto,
  ProductoPrecio,
  AlertasInventario,
  LoginRequest,
  VentaRequest,
  CompraRequest,
  Laboratorio,
  Categoria,
  Presentacion,
  Cargo,
  Cliente,
} from '../types/index.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiErrorResponse {
  success: boolean;
  message: string;
  error?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Inyectar JWT en cada petición
    this.client.interceptors.request.use((config) => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          const token = parsed?.token;
          if (token) config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // token corrupto — ignorar
      }
      return config;
    });

    // Redirigir al login si el token expira
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
const http = apiClient.getClient();

// ============================================================
// AUTH
// ============================================================

export async function loginApi(
  credentials: LoginRequest
): Promise<ApiResponse<{ token: string; user: any }>> {
  const res = await http.post<ApiResponse<{ token: string; user: any }>>(
    '/auth/login',
    credentials
  );
  return res.data;
}

/** Registro público (cargo fijo Vendedor en el backend) */
export async function registrarApi(data: {
  dni: string;
  nombres: string;
  apellidos: string;
  username: string;
  password: string;
}): Promise<ApiResponse<{ username: string }>> {
  const res = await http.post<ApiResponse<{ username: string }>>('/auth/registrar', data);
  return res.data;
}

/** Registro interno desde RRHH (requiere JWT Administrador) */
export async function registrarEmpleadoConUsuario(data: {
  dni: string;
  nombres: string;
  apellidos: string;
  username: string;
  password: string;
  id_cargo: number;
}): Promise<ApiResponse<{ username: string; nombres: string; apellidos: string }>> {
  const res = await http.post<ApiResponse<{ username: string; nombres: string; apellidos: string }>>(
    '/auth/register',
    data
  );
  return res.data;
}

// ============================================================
// USUARIOS / EMPLEADOS
// ============================================================

export interface UsuarioListado {
  id_empleado: number;
  dni: string;
  nombre_completo: string;
  nombres: string;
  apellidos: string;
  nombre_cargo: string;
  id_usuario: number | null;
  username: string | null;
  fecha_creacion: string | null;
}

export interface EmpleadoBuscado {
  id_empleado: number;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  dni: string;
  nombre_cargo: string;
}

export async function getUsuarios(busqueda: string = ''): Promise<UsuarioListado[]> {
  const res = await http.get<ApiResponse<UsuarioListado[]>>('/auth/usuarios', {
    params: { busqueda },
  });
  const payload = res.data?.data;
  if (!payload) return [];
  const rows: UsuarioListado[] = Array.isArray(payload[0]) ? (payload[0] as any) : payload;
  return rows.filter(Boolean);
}

export async function buscarEmpleadoPorDni(dni: string): Promise<EmpleadoBuscado | null> {
  const res = await http.get<ApiResponse<EmpleadoBuscado>>(`/empleados/buscar/${dni.trim()}`);
  return res.data?.data ?? null;
}

export async function crearCredencialApi(data: {
  id_empleado: number;
  username: string;
  password: string;
}): Promise<ApiResponse<{ username: string; id_empleado: number }>> {
  const res = await http.post<ApiResponse<{ username: string; id_empleado: number }>>(
    '/auth/crear-credencial',
    data
  );
  return res.data;
}

// ============================================================
// PRODUCTOS
// ============================================================

export async function getProductos(): Promise<Producto[]> {
  const res = await http.get<ApiResponse<any>>('/producto/listar');
  const payload = res.data?.data;
  if (!payload) return [];
  const rows: Producto[] = Array.isArray(payload[0]) ? payload[0] : payload;
  return rows.filter(Boolean);
}

export async function getPreciosProducto(id_producto: number): Promise<ProductoPrecio[]> {
  const res = await http.get<ApiResponse<any>>(`/producto/${id_producto}/precios`);
  const payload = res.data?.data;
  if (!payload) return [];
  const rows: ProductoPrecio[] = Array.isArray(payload[0]) ? payload[0] : payload;
  return rows.filter(Boolean);
}

export interface RegistrarProductoRequest {
  id_laboratorio: number;
  id_categoria: number;
  id_presentacion: number;
  nombre_comercial: string;
  principio_activo?: string;
  stock_minimo?: number;
}

export async function registrarProductoApi(
  data: RegistrarProductoRequest
): Promise<ApiResponse<{ nombre_comercial: string }>> {
  const res = await http.post<ApiResponse<{ nombre_comercial: string }>>(
    '/producto/registrar',
    data
  );
  return res.data;
}

// ============================================================
// VENTAS Y COMPRAS
// ============================================================

export async function registrarVenta(
  venta: VentaRequest
): Promise<ApiResponse<{ id_venta: number }>> {
  const res = await http.post<ApiResponse<{ id_venta: number }>>('/ventas/', venta);
  return res.data;
}

export async function registrarCompra(
  compra: CompraRequest
): Promise<ApiResponse<{ id_compra: number }>> {
  const res = await http.post<ApiResponse<{ id_compra: number }>>('/compras/', compra);
  return res.data;
}

// ============================================================
// REPORTES
// ============================================================

export async function getAlertasInventario(): Promise<AlertasInventario> {
  const res = await http.get<ApiResponse<AlertasInventario>>('/reportes/alertas');
  return res.data.data ?? { lotesPorVencer: [], productosStockBajo: [] };
}

// ============================================================
// CATÁLOGOS
// ============================================================

export async function getLaboratorios(): Promise<Laboratorio[]> {
  const res = await http.get<ApiResponse<any[]>>('/catalogo/laboratorios');
  return (res.data?.data ?? []).map((r: any) => ({
    id_laboratorio: r.id_laboratorio,
    nombre_laboratorio: r.nombre_laboratorio,
  }));
}

export async function getCategorias(): Promise<Categoria[]> {
  const res = await http.get<ApiResponse<any[]>>('/catalogo/categorias');
  return (res.data?.data ?? []).map((r: any) => ({
    id_categoria: r.id_categoria,
    nombre_categoria: r.nombre_categoria,
  }));
}

export async function getPresentaciones(): Promise<Presentacion[]> {
  const res = await http.get<ApiResponse<any[]>>('/catalogo/presentaciones');
  return (res.data?.data ?? []).map((r: any) => ({
    id_presentacion: r.id_presentacion,
    nombre_presentacion: r.nombre_presentacion,
  }));
}

export async function getCargos(): Promise<Cargo[]> {
  const res = await http.get<ApiResponse<any[]>>('/catalogo/cargos');
  return (res.data?.data ?? []).map((r: any) => ({
    id_cargo: r.id_cargo,
    nombre_cargo: r.nombre_cargo,
  }));
}

export async function crearEntradaCatalogo(
  tabla: string,
  nombre: string
): Promise<ApiResponse<{ id: number; nombre: string }>> {
  const res = await http.post<ApiResponse<{ id: number; nombre: string }>>(
    `/catalogo/${tabla}`,
    { nombre }
  );
  return res.data;
}

export async function actualizarEntradaCatalogo(
  tabla: string,
  id: number,
  nombre: string
): Promise<ApiResponse<{ id: number; nombre: string }>> {
  const res = await http.put<ApiResponse<{ id: number; nombre: string }>>(
    `/catalogo/${tabla}/${id}`,
    { nombre }
  );
  return res.data;
}

export async function eliminarEntradaCatalogo(
  tabla: string,
  id: number
): Promise<ApiResponse<null>> {
  const res = await http.delete<ApiResponse<null>>(`/catalogo/${tabla}/${id}`);
  return res.data;
}

// ============================================================
// CLIENTES
// ============================================================

export async function buscarClientePorDni(dni: string): Promise<Cliente | null> {
  try {
    const res = await http.get<ApiResponse<Cliente>>(`/clientes/buscar/${dni.trim()}`);
    return res.data?.data ?? null;
  } catch {
    return null;
  }
}

export async function getClienteGenerico(): Promise<Cliente> {
  const res = await http.get<ApiResponse<Cliente>>('/clientes/generico');
  return (
    res.data?.data ?? {
      id_cliente: 1,
      nombres: 'PÚBLICO',
      apellidos: 'EN GENERAL',
      dni: '00000000',
    }
  );
}

// Re-exportar tipos
export type {
  Producto,
  ProductoPrecio,
  AlertasInventario,
  LotePorVencer,
  ProductoStockBajo,
  VentaRequest,
  DetalleVentaRequest,
  CompraRequest,
  DetalleCompraRequest,
  ApiResponse,
  Laboratorio,
  Categoria,
  Presentacion,
  Cargo,
  Cliente,
} from '../types/index.ts';