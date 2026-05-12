// ===== TIPOS DE RESPUESTA DE STORED PROCEDURES =====

export interface LoginResponse {
  id_usuario: number;
  username: string;
  password_hash: string;
  nombres: string;
  apellidos: string;
  nombre_cargo: string;
}

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

export interface ProductoPrecio {
  id_producto_precio: number;
  nombre_unidad: string;
  cantidad_equivalente: number;
  precio_venta: number;
}

export interface VentaCrear {
  id_venta_generada: number;
}

export interface CompraCrear {
  id_compra_generada: number;
}

// ===== TIPOS DE CATÁLOGOS =====

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

// ===== TIPOS PARA SOLICITUDES (Request Bodies) =====

export interface LoginRequest {
  username: string;
  password: string;
}

// ===== JWT PAYLOAD =====

export interface JwtPayload {
  id_usuario: number;
  username: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  iat?: number;
  exp?: number;
}

// ===== RESPUESTA GENÉRICA DE API =====

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}