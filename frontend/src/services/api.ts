/**
 * src/services/api.ts
 * Instancia Axios centralizada + funciones de servicio para todos los endpoints.
 * Los tipos se importan desde src/types/index.ts (derivados del esquema SQL).
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
} from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================
// CLASE AXIOS CLIENT (singleton)
// ============================================================

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

    // Interceptor REQUEST: inyectar JWT desde localStorage
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

    // Interceptor RESPONSE: redirigir al login si token expiró (401)
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
// FUNCIONES DE SERVICIO — una por endpoint
// ============================================================

/**
 * POST /api/auth/login
 * Usa SP_Login → valida bcrypt → devuelve token JWT + datos del empleado
 */
export async function loginApi(
  credentials: LoginRequest
): Promise<ApiResponse<{ token: string; user: any }>> {
  const res = await http.post<ApiResponse<{ token: string; user: any }>>(
    '/auth/login',
    credentials
  );
  return res.data;
}

/**
 * GET /api/producto/listar
 * Ejecuta SP_Producto_Listar() — devuelve todos los productos con
 * nombre_categoria, nombre_laboratorio, nombre_presentacion y proximo_vencimiento.
 *
 * NOTA: MySQL2 con CALL puede devolver [[filas], OkPacket] o [filas].
 * Esta función normaliza ambas formas.
 */
export async function getProductos(): Promise<Producto[]> {
  const res = await http.get<ApiResponse<any>>('/producto/listar');

  // ── DEBUG: ver estructura exacta que llega del backend ──────────────
  console.log('[API] /producto/listar → res.data:', JSON.stringify(res.data).slice(0, 400));
  // ────────────────────────────────────────────────────────────────────

  const payload = res.data?.data;

  // Normalizar: si MySQL devolvió [[filas], OkPacket] en vez de [filas]
  let rows: Producto[];
  if (!payload) {
    rows = [];
  } else if (Array.isArray(payload[0])) {
    // forma anidada: data = [[{...}, {...}], OkPacket]
    rows = payload[0] as Producto[];
    console.log('[API] Detectado wrapper anidado — usando payload[0]. Filas:', rows.length);
  } else {
    // forma plana: data = [{...}, {...}]
    rows = payload as Producto[];
    console.log('[API] Forma plana correcta. Filas:', rows.length);
  }

  return rows.filter(Boolean);
}

/**
 * GET /api/producto/:id_producto/precios
 * Ejecuta SP_Producto_Precios(id_producto) — devuelve las presentaciones
 * de venta (Caja, Blíster, Unidad) con su precio_venta.
 */
export async function getPreciosProducto(id_producto: number): Promise<ProductoPrecio[]> {
  const res = await http.get<ApiResponse<any>>(
    `/producto/${id_producto}/precios`
  );
  const payload = res.data?.data;
  if (!payload) return [];
  // Mismo problema que SP_Producto_Listar: CALL devuelve [[rows], OkPacket]
  const rows: ProductoPrecio[] = Array.isArray(payload[0]) ? payload[0] : payload;
  return rows.filter(Boolean);
}

/**
 * POST /api/ventas/
 * Cuerpo: VentaRequest (cabecera + detalles).
 * Backend: SP_Venta_Crear → inserta Detalle_Ventas → descuenta stock FIFO.
 * Responde 201 con { id_venta: number }.
 */
export async function registrarVenta(
  venta: VentaRequest
): Promise<ApiResponse<{ id_venta: number }>> {
  const res = await http.post<ApiResponse<{ id_venta: number }>>('/ventas/', venta);
  return res.data;
}

/**
 * POST /api/compras/
 * Cuerpo: CompraRequest (cabecera + detalles con lotes).
 * Backend: SP_Compra_Crear → crea Lotes → inserta Detalle_Compras → aumenta stock.
 * Responde 201 con { id_compra: number }.
 */
export async function registrarCompra(
  compra: CompraRequest
): Promise<ApiResponse<{ id_compra: number }>> {
  const res = await http.post<ApiResponse<{ id_compra: number }>>('/compras/', compra);
  return res.data;
}

/**
 * GET /api/reportes/alertas
 * Devuelve dos listas:
 *   - lotesPorVencer: Lotes con stock > 0 que vencen en < 3 meses
 *   - productosStockBajo: Productos donde stock_actual_unidades <= stock_minimo_unidades
 */
export async function getAlertasInventario(): Promise<AlertasInventario> {
  const res = await http.get<ApiResponse<AlertasInventario>>('/reportes/alertas');
  return res.data.data ?? { lotesPorVencer: [], productosStockBajo: [] };
}

// Re-exportar tipos para que los componentes puedan importar desde un solo lugar
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
} from '../types/index';

/**
 * POST /api/auth/registrar
 * Registra un nuevo empleado + usuario con id_cargo=1 por defecto
 * Manda password en texto plano — el backend hace el hash con bcrypt
 */
export async function registrarApi(data: {
  dni: string;
  nombres: string;
  apellidos: string;
  username: string;
  password: string;
}): Promise<ApiResponse<{ username: string }>> {
  const res = await http.post<ApiResponse<{ username: string }>>(
    '/auth/registrar',
    data
  );
  return res.data;
}