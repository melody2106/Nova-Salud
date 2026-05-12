/**
 * src/types/index.ts
 * Tipos TypeScript alineados 1:1 con el backend de Nova Salud.
 */

// ── Respuestas de SPs ──────────────────────────────────────────

export interface SPLoginRow {
  id_usuario: number;
  username: string;
  password_hash: string;
  nombres: string;
  apellidos: string;
  nombre_cargo: string;
}

export interface Producto {
  id_producto: number;
  nombre_comercial: string;
  principio_activo: string | null;
  nombre_categoria: string;
  nombre_laboratorio: string;
  nombre_presentacion: string;
  stock_actual_unidades: number;
  proximo_vencimiento: string | null;
}

export interface ProductoPrecio {
  id_producto_precio: number;
  nombre_unidad: string;
  cantidad_equivalente: number;
  precio_venta: number;
}

// ── Request bodies ─────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface DetalleVentaRequest {
  id_producto: number;
  id_producto_precio: number | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface VentaRequest {
  id_tipo_comprobante: number;
  id_cliente: number;
  id_usuario: number;
  total: number;
  metodo_pago: string;
  detalles: DetalleVentaRequest[];
}

export interface DetalleCompraRequest {
  id_producto: number;
  codigo_lote: string;
  fecha_vencimiento: string;
  cantidad: number;
  precio_unitario: number;
}

export interface CompraRequest {
  id_laboratorio: number;
  id_usuario: number;
  numero_factura_compra: string;
  total_compra: number;
  detalles: DetalleCompraRequest[];
}

// ── Alertas de inventario ─────────────────────────────────────

export interface LotePorVencer {
  nombre_comercial: string;
  codigo_lote: string;
  fecha_vencimiento: string;
  stock_actual_lote: number;
  id_producto: number;
}

export interface ProductoStockBajo {
  id_producto: number;
  nombre_comercial: string;
  stock_actual_unidades: number;
  stock_minimo_unidades: number;
}

export interface AlertasInventario {
  lotesPorVencer: LotePorVencer[];
  productosStockBajo: ProductoStockBajo[];
}

// ── Catálogos ─────────────────────────────────────────────────

export interface ItemCatalogo {
  id: number;      // campo id_* normalizado
  nombre: string;  // campo nombre_* normalizado
  [key: string]: any;
}

export interface Laboratorio {
  id_laboratorio: number;
  nombre_laboratorio: string;
}

export interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
}

export interface Presentacion {
  id_presentacion: number;
  nombre_presentacion: string;
}

export interface Cargo {
  id_cargo: number;
  nombre_cargo: string;
}

// ── Clientes ──────────────────────────────────────────────────

export interface Cliente {
  id_cliente: number;
  nombres: string;
  apellidos: string;
  dni: string;
  ruc?: string | null;
}

// ── Respuesta genérica ────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}