// ===== TIPOS DE RESPUESTA DE STORED PROCEDURES =====

// SP_Login: Usuario con datos del empleado y su cargo
export interface LoginResponse {
  id_usuario: number;
  username: string;
  password_hash: string;
  nombres: string;
  apellidos: string;
  nombre_cargo: string;
}

// SP_Producto_Listar: Listado de productos con info de categoría, laboratorio, etc.
export interface ProductoListar {
  id_producto: number;
  nombre_comercial: string;
  principio_activo: string;
  nombre_categoria: string;
  nombre_laboratorio: string;
  nombre_presentacion: string;
  stock_actual_unidades: number;
  proximo_vencimiento: string | null;
}

// SP_Producto_Precios: Precios disponibles de un producto
export interface ProductoPrecio {
  id_producto_precio: number;
  nombre_unidad: string;
  cantidad_equivalente: number;
  precio_venta: number;
}

// SP_Venta_Crear: Respuesta de creación de venta
export interface VentaCrear {
  id_venta_generada: number;
}

// SP_Compra_Crear: Respuesta de creación de compra
export interface CompraCrear {
  id_compra_generada: number;
}

// ===== TIPOS PARA SOLICITUDES (Request Bodies) =====

// Login Request
export interface LoginRequest {
  username: string;
  password: string;
}

// Response genérico de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
