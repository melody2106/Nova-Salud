/**
 * src/types/index.ts
 * Interfaces TypeScript derivadas ESTRICTAMENTE del esquema SQL de nova_salud.
 * Cada campo corresponde 1:1 con una columna o alias de Procedimiento Almacenado.
 */

// ============================================================
// RESPUESTAS DE PROCEDIMIENTOS ALMACENADOS (SP)
// ============================================================

/**
 * SP_Login — devuelve una fila con estos campos.
 * Los campos vienen del JOIN: Usuarios + Empleados + Cargos
 */
export interface SPLoginRow {
  id_usuario: number;
  username: string;
  password_hash: string;
  nombres: string;
  apellidos: string;
  nombre_cargo: string; // de Cargos.nombre_cargo
}

/**
 * SP_Producto_Listar — devuelve un array de estas filas.
 * JOIN: Productos + Categorias + Laboratorios + Presentaciones
 * proximo_vencimiento viene de subconsulta a Lotes.
 */
export interface Producto {
  id_producto: number;
  nombre_comercial: string;
  principio_activo: string | null;       // columna permite NULL en Productos
  nombre_categoria: string;              // de Categorias.nombre_categoria
  nombre_laboratorio: string;            // de Laboratorios.nombre_laboratorio
  nombre_presentacion: string;           // de Presentaciones.nombre_presentacion
  stock_actual_unidades: number;         // Productos.stock_actual_unidades
  proximo_vencimiento: string | null;    // subconsulta MIN(Lotes.fecha_vencimiento)
}

/**
 * SP_Producto_Precios — devuelve filas para un id_producto dado.
 * JOIN: Productos_Precios + Unidades_Medida
 */
export interface ProductoPrecio {
  id_producto_precio: number;            // Productos_Precios.id_producto_precio
  nombre_unidad: string;                 // Unidades_Medida.nombre_unidad
  cantidad_equivalente: number;          // Productos_Precios.cantidad_equivalente
  precio_venta: number;                  // Productos_Precios.precio_venta
}

// ============================================================
// REQUEST BODIES (lo que enviamos en POST)
// ============================================================

/** POST /api/auth/login */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Detalle de cada ítem en una venta.
 * Corresponde a una fila en Detalle_Ventas.
 */
export interface DetalleVentaRequest {
  id_producto: number;                   // Detalle_Ventas.id_producto (FK → Productos)
  id_producto_precio: number | null;     // Detalle_Ventas.id_producto_precio (FK → Productos_Precios, nullable)
  cantidad: number;                      // Detalle_Ventas.cantidad
  precio_unitario: number;              // Detalle_Ventas.precio_unitario
  subtotal: number;                      // Detalle_Ventas.subtotal = cantidad * precio_unitario
}

/**
 * Cuerpo completo para POST /api/ventas/
 * Cabecera más array de detalles.
 * Cabecera → SP_Venta_Crear(id_tipo_comprobante, id_cliente, id_usuario, total)
 */
export interface VentaRequest {
  id_tipo_comprobante: number;           // 1 = Boleta, 2 = Factura (Tipos_Comprobantes)
  id_cliente: number;                    // Clientes.id_cliente (1 = Público General)
  id_usuario: number;                    // Usuarios.id_usuario (el cajero autenticado)
  total: number;                         // Ventas.total
  metodo_pago: string;                   // efectivo | tarjeta | transferencia
  detalles: DetalleVentaRequest[];
}

/**
 * Detalle de cada producto en una compra.
 * Corresponde a: crear Lote + insertar Detalle_Compras + aumentar stock.
 */
export interface DetalleCompraRequest {
  id_producto: number;                   // FK → Productos.id_producto
  codigo_lote: string;                   // Lotes.codigo_lote
  fecha_vencimiento: string;             // Lotes.fecha_vencimiento ('YYYY-MM-DD')
  cantidad: number;                      // Lotes.stock_inicial / Detalle_Compras.cantidad_comprada
  precio_unitario: number;              // Detalle_Compras.precio_unitario_compra
}

/**
 * Cuerpo completo para POST /api/compras/
 * Cabecera → SP_Compra_Crear(id_laboratorio, id_usuario, numero_factura, total)
 */
export interface CompraRequest {
  id_laboratorio: number;                // Compras.id_laboratorio (FK → Laboratorios)
  id_usuario: number;                    // Compras.id_usuario (FK → Usuarios)
  numero_factura_compra: string;         // Compras.numero_factura_compra
  total_compra: number;                  // Compras.total_compra
  detalles: DetalleCompraRequest[];
}

// ============================================================
// RESPUESTAS DEL ENDPOINT GET /api/reportes/alertas
// ============================================================

/** Un lote que vence en menos de 3 meses (y tiene stock) */
export interface LotePorVencer {
  nombre_comercial: string;              // Productos.nombre_comercial
  codigo_lote: string;                   // Lotes.codigo_lote
  fecha_vencimiento: string;             // Lotes.fecha_vencimiento
  stock_actual_lote: number;             // Lotes.stock_actual_lote
  id_producto: number;                   // Lotes.id_producto
}

/** Un producto cuyo stock está en o por debajo del mínimo */
export interface ProductoStockBajo {
  id_producto: number;
  nombre_comercial: string;
  stock_actual_unidades: number;         // Productos.stock_actual_unidades
  stock_minimo_unidades: number;         // Productos.stock_minimo_unidades
}

export interface AlertasInventario {
  lotesPorVencer: LotePorVencer[];
  productosStockBajo: ProductoStockBajo[];
}

// ============================================================
// ENVOLTURA GENÉRICA DE LA API (wrapper del backend)
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
