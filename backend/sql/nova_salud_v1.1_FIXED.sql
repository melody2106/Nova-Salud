-- =============================================================================
--  SISTEMA DE VENTAS - BOTICA "NOVA SALUD"
--  Script DDL + Stored Procedures
--  Motor: MySQL 8.0+
--  Autor: Arquitecto de Base de Datos
--  Versión: 1.1 — Corrección aplicada:
--    * SP_Generar_Venta: Error #1308 "LEAVE with no matching label" corregido.
--      Se agregó etiqueta "SP_Generar_Venta:" al bloque BEGIN...END principal.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. CONFIGURACIÓN INICIAL
-- ---------------------------------------------------------------------------
DROP DATABASE IF EXISTS nova_salud;
CREATE DATABASE nova_salud
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE nova_salud;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';


-- =============================================================================
-- SECCIÓN 1: TABLAS DE CLASIFICACIÓN Y CATÁLOGOS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 Laboratorios / Proveedores
-- ---------------------------------------------------------------------------
CREATE TABLE Laboratorios (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(120)    NOT NULL,
    contacto      VARCHAR(100)    NULL,
    telefono      VARCHAR(20)     NULL,
    email         VARCHAR(100)    NULL,
    direccion     VARCHAR(200)    NULL,
    estado        TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1=Activo, 0=Inactivo',
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_laboratorios PRIMARY KEY (id),
    CONSTRAINT uq_laboratorios_nombre UNIQUE (nombre)
) ENGINE=InnoDB COMMENT='Laboratorios y fabricantes de productos';

-- ---------------------------------------------------------------------------
-- 1.2 Categorías de Productos
-- ---------------------------------------------------------------------------
CREATE TABLE Categorias (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(80)     NOT NULL,
    descripcion   VARCHAR(255)    NULL,
    estado        TINYINT(1)      NOT NULL DEFAULT 1,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_categorias PRIMARY KEY (id),
    CONSTRAINT uq_categorias_nombre UNIQUE (nombre)
) ENGINE=InnoDB COMMENT='Clasificación de productos farmacéuticos';

-- ---------------------------------------------------------------------------
-- 1.3 Presentaciones (comprimido, jarabe, ampolla, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE Presentaciones (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(80)     NOT NULL,
    estado        TINYINT(1)      NOT NULL DEFAULT 1,
    CONSTRAINT pk_presentaciones PRIMARY KEY (id),
    CONSTRAINT uq_presentaciones_nombre UNIQUE (nombre)
) ENGINE=InnoDB COMMENT='Forma farmacéutica del producto';

-- ---------------------------------------------------------------------------
-- 1.4 Unidades de Medida
-- ---------------------------------------------------------------------------
CREATE TABLE Unidades_Medida (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(40)     NOT NULL,
    abreviatura   VARCHAR(10)     NOT NULL,
    CONSTRAINT pk_unidades_medida PRIMARY KEY (id),
    CONSTRAINT uq_unidades_medida_nombre UNIQUE (nombre)
) ENGINE=InnoDB COMMENT='mg, ml, comprimido, caja, frasco, etc.';

-- ---------------------------------------------------------------------------
-- 1.5 Vías de Administración  (MEJORA REQUERIDA)
-- ---------------------------------------------------------------------------
CREATE TABLE Vias_Administracion (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(60)     NOT NULL COMMENT 'Ej: Oral, Intravenosa, Tópica, Sublingual',
    descripcion   VARCHAR(200)    NULL,
    estado        TINYINT(1)      NOT NULL DEFAULT 1,
    CONSTRAINT pk_vias_administracion PRIMARY KEY (id),
    CONSTRAINT uq_vias_administracion_nombre UNIQUE (nombre)
) ENGINE=InnoDB COMMENT='Ruta de administración del medicamento';


-- =============================================================================
-- SECCIÓN 2: RECURSOS HUMANOS Y ACCESO
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 Cargos
-- ---------------------------------------------------------------------------
CREATE TABLE Cargos (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(80)     NOT NULL,
    descripcion   VARCHAR(200)    NULL,
    estado        TINYINT(1)      NOT NULL DEFAULT 1,
    CONSTRAINT pk_cargos PRIMARY KEY (id),
    CONSTRAINT uq_cargos_nombre UNIQUE (nombre)
) ENGINE=InnoDB COMMENT='Cargos del personal de la botica';

-- ---------------------------------------------------------------------------
-- 2.2 Empleados
-- ---------------------------------------------------------------------------
CREATE TABLE Empleados (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    dni           CHAR(8)         NOT NULL COMMENT 'DNI peruano 8 dígitos',
    nombres       VARCHAR(80)     NOT NULL,
    apellidos     VARCHAR(80)     NOT NULL,
    telefono      VARCHAR(15)     NULL,
    email         VARCHAR(100)    NULL,
    id_cargo      INT UNSIGNED    NOT NULL,
    fecha_ingreso DATE            NOT NULL,
    estado        TINYINT(1)      NOT NULL DEFAULT 1,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_empleados PRIMARY KEY (id),
    CONSTRAINT uq_empleados_dni UNIQUE (dni),
    CONSTRAINT fk_empleados_cargo FOREIGN KEY (id_cargo)
        REFERENCES Cargos (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Personal de la botica';

-- ---------------------------------------------------------------------------
-- 2.3 Usuarios del Sistema  (MEJORA: hash bcrypt 60 chars)
-- ---------------------------------------------------------------------------
CREATE TABLE Usuarios (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    username        VARCHAR(50)     NOT NULL,
    password_hash   CHAR(60)        NOT NULL COMMENT 'Hash bcrypt de 60 caracteres',
    id_empleado     INT UNSIGNED    NOT NULL,
    rol             ENUM('admin','vendedor','almacenero') NOT NULL DEFAULT 'vendedor',
    ultimo_acceso   DATETIME        NULL,
    estado          TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_username UNIQUE (username),
    CONSTRAINT uq_usuarios_empleado UNIQUE (id_empleado),
    CONSTRAINT fk_usuarios_empleado FOREIGN KEY (id_empleado)
        REFERENCES Empleados (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Credenciales de acceso al sistema. Las consultas se hacen por ID.';


-- =============================================================================
-- SECCIÓN 3: PRODUCTOS Y PRECIOS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 Productos  (MEJORA: incluye id_via_administracion)
-- ---------------------------------------------------------------------------
CREATE TABLE Productos (
    id                   INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    id_laboratorio       INT UNSIGNED     NOT NULL,
    id_categoria         INT UNSIGNED     NOT NULL,
    id_presentacion      INT UNSIGNED     NOT NULL,
    id_via_administracion INT UNSIGNED    NULL COMMENT 'Puede ser NULL para productos no medicinales',
    nombre_comercial     VARCHAR(150)     NOT NULL,
    principio_activo     VARCHAR(200)     NULL COMMENT 'Principio activo o composición',
    concentracion        VARCHAR(50)      NULL COMMENT 'Ej: 500mg, 10mg/5ml',
    codigo_barras        VARCHAR(50)      NULL,
    stock_actual         DECIMAL(10,2)   NOT NULL DEFAULT 0,
    stock_minimo         DECIMAL(10,2)   NOT NULL DEFAULT 5,
    requiere_receta      TINYINT(1)      NOT NULL DEFAULT 0,
    fecha_vencimiento    DATE             NULL,
    estado               TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1=Activo, 0=Descontinuado',
    created_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_productos PRIMARY KEY (id),
    CONSTRAINT uq_productos_codigo_barras UNIQUE (codigo_barras),
    CONSTRAINT fk_productos_laboratorio FOREIGN KEY (id_laboratorio)
        REFERENCES Laboratorios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_productos_categoria FOREIGN KEY (id_categoria)
        REFERENCES Categorias (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_productos_presentacion FOREIGN KEY (id_presentacion)
        REFERENCES Presentaciones (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_productos_via FOREIGN KEY (id_via_administracion)
        REFERENCES Vias_Administracion (id) ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_productos_nombre (nombre_comercial),
    INDEX idx_productos_principio (principio_activo),
    INDEX idx_productos_estado (estado),
    INDEX idx_productos_stock (stock_actual)
) ENGINE=InnoDB COMMENT='Catálogo de productos de la botica';

-- ---------------------------------------------------------------------------
-- 3.2 Precios por Unidad de Venta
-- ---------------------------------------------------------------------------
CREATE TABLE Productos_Precios (
    id                   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_producto          INT UNSIGNED    NOT NULL,
    id_unidad            INT UNSIGNED    NOT NULL,
    descripcion          VARCHAR(80)     NULL COMMENT 'Ej: Caja x 30 comprimidos',
    cantidad_equivalente DECIMAL(10,3)  NOT NULL DEFAULT 1 COMMENT 'Unidades base que representa',
    precio_venta         DECIMAL(10,2)  NOT NULL,
    precio_costo         DECIMAL(10,2)  NULL,
    es_precio_default    TINYINT(1)     NOT NULL DEFAULT 0,
    estado               TINYINT(1)     NOT NULL DEFAULT 1,
    created_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_productos_precios PRIMARY KEY (id),
    CONSTRAINT fk_pp_producto FOREIGN KEY (id_producto)
        REFERENCES Productos (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_pp_unidad FOREIGN KEY (id_unidad)
        REFERENCES Unidades_Medida (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_pp_producto (id_producto)
) ENGINE=InnoDB COMMENT='Distintas presentaciones de venta de un producto con sus precios';


-- =============================================================================
-- SECCIÓN 4: CLIENTES Y FACTURACIÓN
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4.1 Tipos de Documento de Identidad
-- ---------------------------------------------------------------------------
CREATE TABLE Tipos_Documento_Identidad (
    id      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre  VARCHAR(40)     NOT NULL COMMENT 'DNI, RUC, CE, Pasaporte',
    codigo  VARCHAR(5)      NOT NULL COMMENT 'Código SUNAT',
    CONSTRAINT pk_tdi PRIMARY KEY (id),
    CONSTRAINT uq_tdi_codigo UNIQUE (codigo)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 4.2 Clientes
-- ---------------------------------------------------------------------------
CREATE TABLE Clientes (
    id                   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_tipo_doc          INT UNSIGNED    NULL,
    numero_documento     VARCHAR(20)     NULL,
    nombres_razon_social VARCHAR(200)    NOT NULL,
    telefono             VARCHAR(15)     NULL,
    email                VARCHAR(100)    NULL,
    direccion            VARCHAR(200)    NULL,
    es_cliente_generico  TINYINT(1)     NOT NULL DEFAULT 0 COMMENT 'Cliente sin identificar (ventas rápidas)',
    estado               TINYINT(1)     NOT NULL DEFAULT 1,
    created_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_clientes PRIMARY KEY (id),
    CONSTRAINT fk_clientes_tipo_doc FOREIGN KEY (id_tipo_doc)
        REFERENCES Tipos_Documento_Identidad (id) ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_clientes_documento (numero_documento),
    INDEX idx_clientes_nombre (nombres_razon_social)
) ENGINE=InnoDB COMMENT='Clientes de la botica';

-- ---------------------------------------------------------------------------
-- 4.3 Tipos de Comprobantes (Boleta, Factura, Nota de Venta)
-- ---------------------------------------------------------------------------
CREATE TABLE Tipos_Comprobantes (
    id                 INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre_documento   VARCHAR(60)     NOT NULL COMMENT 'Boleta, Factura, Nota de Venta',
    serie_actual       CHAR(4)         NOT NULL COMMENT 'Ej: B001, F001',
    correlativo_actual INT UNSIGNED    NOT NULL DEFAULT 0,
    sunat_code         VARCHAR(5)      NULL COMMENT 'Código de tipo de documento SUNAT',
    estado             TINYINT(1)      NOT NULL DEFAULT 1,
    CONSTRAINT pk_tipos_comprobantes PRIMARY KEY (id),
    CONSTRAINT uq_tipos_comprobantes_serie UNIQUE (serie_actual)
) ENGINE=InnoDB COMMENT='Series y correlativos de comprobantes de pago';

-- ---------------------------------------------------------------------------
-- 4.4 Ventas (Cabecera)
-- ---------------------------------------------------------------------------
CREATE TABLE Ventas (
    id                   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_tipo_comprobante  INT UNSIGNED    NOT NULL,
    serie_documento      CHAR(4)         NOT NULL,
    numero_documento     CHAR(8)         NOT NULL COMMENT 'Correlativo con padding de ceros',
    fecha_hora           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_cliente           INT UNSIGNED    NOT NULL,
    id_usuario           INT UNSIGNED    NOT NULL,
    subtotal             DECIMAL(10,2)  NOT NULL DEFAULT 0,
    igv                  DECIMAL(10,2)  NOT NULL DEFAULT 0,
    total                DECIMAL(10,2)  NOT NULL DEFAULT 0,
    tipo_pago            ENUM('efectivo','tarjeta','transferencia','mixto') NOT NULL DEFAULT 'efectivo',
    monto_pagado         DECIMAL(10,2)  NULL,
    vuelto               DECIMAL(10,2)  NULL,
    observaciones        VARCHAR(255)   NULL,
    estado               ENUM('emitida','anulada') NOT NULL DEFAULT 'emitida',
    created_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_ventas PRIMARY KEY (id),
    CONSTRAINT uq_ventas_comprobante UNIQUE (id_tipo_comprobante, serie_documento, numero_documento),
    CONSTRAINT fk_ventas_tipo_comp FOREIGN KEY (id_tipo_comprobante)
        REFERENCES Tipos_Comprobantes (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_cliente FOREIGN KEY (id_cliente)
        REFERENCES Clientes (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_usuario FOREIGN KEY (id_usuario)
        REFERENCES Usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_ventas_fecha (fecha_hora),
    INDEX idx_ventas_cliente (id_cliente),
    INDEX idx_ventas_usuario (id_usuario)
) ENGINE=InnoDB COMMENT='Cabecera de ventas/comprobantes';

-- ---------------------------------------------------------------------------
-- 4.5 Detalle de Ventas
-- ---------------------------------------------------------------------------
CREATE TABLE Detalle_Ventas (
    id                   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_venta             INT UNSIGNED    NOT NULL,
    id_producto          INT UNSIGNED    NOT NULL,
    id_producto_precio   INT UNSIGNED    NOT NULL,
    cantidad             DECIMAL(10,3)  NOT NULL,
    precio_unitario      DECIMAL(10,2)  NOT NULL,
    descuento            DECIMAL(10,2)  NOT NULL DEFAULT 0,
    subtotal             DECIMAL(10,2)  NOT NULL,
    CONSTRAINT pk_detalle_ventas PRIMARY KEY (id),
    CONSTRAINT fk_dv_venta FOREIGN KEY (id_venta)
        REFERENCES Ventas (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_dv_producto FOREIGN KEY (id_producto)
        REFERENCES Productos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dv_precio FOREIGN KEY (id_producto_precio)
        REFERENCES Productos_Precios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_dv_venta (id_venta),
    INDEX idx_dv_producto (id_producto)
) ENGINE=InnoDB COMMENT='Líneas de detalle de cada venta';

-- ---------------------------------------------------------------------------
-- MEJORA: Auditoría de movimientos de stock
-- ---------------------------------------------------------------------------
CREATE TABLE Movimientos_Stock (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_producto     INT UNSIGNED    NOT NULL,
    tipo_movimiento ENUM('entrada','salida','ajuste') NOT NULL,
    cantidad        DECIMAL(10,2)  NOT NULL,
    stock_anterior  DECIMAL(10,2)  NOT NULL,
    stock_resultante DECIMAL(10,2) NOT NULL,
    motivo          VARCHAR(100)   NULL COMMENT 'Venta, Compra, Ajuste Inventario',
    id_referencia   INT UNSIGNED   NULL COMMENT 'id_venta u otro documento origen',
    id_usuario      INT UNSIGNED   NOT NULL,
    fecha_hora      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_mov_stock PRIMARY KEY (id),
    CONSTRAINT fk_ms_producto FOREIGN KEY (id_producto)
        REFERENCES Productos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ms_usuario FOREIGN KEY (id_usuario)
        REFERENCES Usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_ms_producto (id_producto),
    INDEX idx_ms_fecha (fecha_hora)
) ENGINE=InnoDB COMMENT='Trazabilidad de entradas y salidas de stock';

SET FOREIGN_KEY_CHECKS = 1;


-- =============================================================================
-- SECCIÓN 5: DATOS SEMILLA (SEED DATA)
-- =============================================================================

INSERT INTO Tipos_Documento_Identidad (nombre, codigo) VALUES
('DNI', '1'),
('RUC', '6'),
('Carné de Extranjería', '4'),
('Pasaporte', '7');

INSERT INTO Vias_Administracion (nombre, descripcion) VALUES
('Oral',          'Administrado por la boca'),
('Intravenosa',   'Inyección directa a la vena'),
('Intramuscular', 'Inyección en músculo'),
('Subcutánea',    'Inyección bajo la piel'),
('Tópica',        'Aplicación sobre la piel'),
('Sublingual',    'Bajo la lengua'),
('Inhalada',      'Vía respiratoria'),
('Rectal',        'Vía rectal'),
('Oftálmica',     'Aplicación ocular');

INSERT INTO Categorias (nombre, descripcion) VALUES
('Analgésicos',         'Medicamentos para el dolor'),
('Antibióticos',        'Medicamentos contra infecciones bacterianas'),
('Antiinflamatorios',   'Reducen inflamación'),
('Vitaminas y Suplementos', 'Nutrición complementaria'),
('Antihistamínicos',    'Alergia y picazón'),
('Antihipertensivos',   'Control de presión arterial'),
('Antidiabéticos',      'Control de glucosa'),
('Dermatológicos',      'Cuidado de la piel'),
('Antiparasitarios',    'Contra parásitos intestinales'),
('Dispositivos Médicos','Equipos y accesorios médicos');

INSERT INTO Presentaciones (nombre) VALUES
('Comprimido'),('Cápsula'),('Jarabe'),('Suspensión'),('Solución oral'),
('Ampolla'),('Inyectable'),('Crema'),('Gel'),('Pomada'),
('Colirio'),('Spray'),('Parche'),('Supositorio'),('Tableta sublingual');

INSERT INTO Unidades_Medida (nombre, abreviatura) VALUES
('Unidad',   'UND'),('Caja',    'CJA'),('Frasco',  'FCO'),
('Blíster',  'BLS'),('Ampolla', 'AMP'),('Tubo',    'TBO'),
('Sobre',    'SOB'),('Strip',   'STR');

INSERT INTO Tipos_Comprobantes (nombre_documento, serie_actual, correlativo_actual, sunat_code) VALUES
('Boleta de Venta',  'B001', 0, '03'),
('Factura',          'F001', 0, '01'),
('Nota de Venta',    'NV01', 0, NULL);

INSERT INTO Cargos (nombre, descripcion) VALUES
('Administrador',    'Control total del sistema'),
('Farmacéutico',     'Regente de la botica'),
('Vendedor',         'Atención al cliente y ventas'),
('Almacenero',       'Control de inventario y stock');

-- Cliente genérico para ventas rápidas
INSERT INTO Clientes (nombres_razon_social, es_cliente_generico) VALUES
('Clientes Varios', 1);

-- Laboratorio de ejemplo
INSERT INTO Laboratorios (nombre, contacto, telefono, email) VALUES
('Laboratorios Bayer S.A.', 'Ventas', '01-2345678', 'ventas@bayer.pe'),
('Medifarma S.A.',          'Comercial', '01-3456789', 'comercial@medifarma.pe'),
('Hersil S.A.',             'Ventas', '01-4567890', 'ventas@hersil.pe');


-- =============================================================================
-- SECCIÓN 6: STORED PROCEDURES
-- =============================================================================
DELIMITER $$

-- ============================================================
-- 6.A  AUTENTICACIÓN
-- ============================================================

-- ------------------------------------------------------------
-- SP_Login: recibe username, devuelve id + hash para que el
--           backend (Node, Python, etc.) compare con bcrypt.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS SP_Login$$
CREATE PROCEDURE SP_Login(
    IN  p_username  VARCHAR(50)
)
BEGIN
    SELECT
        u.id,
        u.username,
        u.password_hash,
        u.rol,
        u.estado,
        e.nombres,
        e.apellidos
    FROM Usuarios  u
    INNER JOIN Empleados e ON e.id = u.id_empleado
    WHERE u.username = p_username
      AND u.estado   = 1
    LIMIT 1;

    -- Actualizar último acceso si se encontró el usuario
    UPDATE Usuarios
    SET ultimo_acceso = NOW()
    WHERE username = p_username AND estado = 1;
END$$


-- ============================================================
-- 6.B  CRUD DE EMPLEADOS
-- ============================================================

-- ---- Insertar Empleado ----
DROP PROCEDURE IF EXISTS SP_Empleado_Insertar$$
CREATE PROCEDURE SP_Empleado_Insertar(
    IN  p_dni           CHAR(8),
    IN  p_nombres       VARCHAR(80),
    IN  p_apellidos     VARCHAR(80),
    IN  p_telefono      VARCHAR(15),
    IN  p_email         VARCHAR(100),
    IN  p_id_cargo      INT UNSIGNED,
    IN  p_fecha_ingreso DATE,
    OUT p_nuevo_id      INT UNSIGNED,
    OUT p_mensaje       VARCHAR(200)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;

    SELECT COUNT(*) INTO v_existe FROM Empleados WHERE dni = p_dni;

    IF v_existe > 0 THEN
        SET p_nuevo_id = 0;
        SET p_mensaje  = 'ERROR: El DNI ya está registrado.';
    ELSE
        INSERT INTO Empleados (dni, nombres, apellidos, telefono, email, id_cargo, fecha_ingreso)
        VALUES (p_dni, p_nombres, p_apellidos, p_telefono, p_email, p_id_cargo, p_fecha_ingreso);

        SET p_nuevo_id = LAST_INSERT_ID();
        SET p_mensaje  = CONCAT('OK: Empleado creado con ID ', p_nuevo_id);
    END IF;
END$$

-- ---- Leer Empleado por ID ----
DROP PROCEDURE IF EXISTS SP_Empleado_LeerPorId$$
CREATE PROCEDURE SP_Empleado_LeerPorId(
    IN p_id INT UNSIGNED
)
BEGIN
    SELECT
        e.id, e.dni, e.nombres, e.apellidos, e.telefono, e.email,
        e.fecha_ingreso, e.estado,
        c.id   AS id_cargo,
        c.nombre AS nombre_cargo
    FROM Empleados e
    INNER JOIN Cargos c ON c.id = e.id_cargo
    WHERE e.id = p_id;
END$$

-- ---- Listar Empleados ----
DROP PROCEDURE IF EXISTS SP_Empleado_Listar$$
CREATE PROCEDURE SP_Empleado_Listar(
    IN p_solo_activos TINYINT(1)  -- 1 = solo activos, 0 = todos
)
BEGIN
    SELECT
        e.id, e.dni,
        CONCAT(e.nombres, ' ', e.apellidos) AS nombre_completo,
        e.telefono, e.email, e.fecha_ingreso, e.estado,
        c.nombre AS cargo
    FROM Empleados e
    INNER JOIN Cargos c ON c.id = e.id_cargo
    WHERE (p_solo_activos = 0 OR e.estado = 1)
    ORDER BY e.apellidos, e.nombres;
END$$

-- ---- Actualizar Empleado ----
DROP PROCEDURE IF EXISTS SP_Empleado_Actualizar$$
CREATE PROCEDURE SP_Empleado_Actualizar(
    IN  p_id            INT UNSIGNED,
    IN  p_telefono      VARCHAR(15),
    IN  p_email         VARCHAR(100),
    IN  p_id_cargo      INT UNSIGNED,
    OUT p_mensaje       VARCHAR(200)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Empleados WHERE id = p_id) THEN
        SET p_mensaje = 'ERROR: Empleado no encontrado.';
    ELSE
        UPDATE Empleados
        SET telefono  = p_telefono,
            email     = p_email,
            id_cargo  = p_id_cargo
        WHERE id = p_id;

        SET p_mensaje = 'OK: Empleado actualizado correctamente.';
    END IF;
END$$

-- ---- Desactivar Empleado (baja lógica) ----
DROP PROCEDURE IF EXISTS SP_Empleado_Desactivar$$
CREATE PROCEDURE SP_Empleado_Desactivar(
    IN  p_id       INT UNSIGNED,
    OUT p_mensaje  VARCHAR(200)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Empleados WHERE id = p_id) THEN
        SET p_mensaje = 'ERROR: Empleado no encontrado.';
    ELSE
        UPDATE Empleados SET estado = 0 WHERE id = p_id;
        -- También desactivar su usuario si lo tiene
        UPDATE Usuarios SET estado = 0 WHERE id_empleado = p_id;
        SET p_mensaje = 'OK: Empleado desactivado.';
    END IF;
END$$


-- ============================================================
-- 6.C  CRUD DE USUARIOS
-- ============================================================

-- ---- Crear Usuario ----
DROP PROCEDURE IF EXISTS SP_Usuario_Insertar$$
CREATE PROCEDURE SP_Usuario_Insertar(
    IN  p_username      VARCHAR(50),
    IN  p_password_hash CHAR(60),   -- bcrypt hash generado en el backend
    IN  p_id_empleado   INT UNSIGNED,
    IN  p_rol           ENUM('admin','vendedor','almacenero'),
    OUT p_nuevo_id      INT UNSIGNED,
    OUT p_mensaje       VARCHAR(200)
)
BEGIN
    IF EXISTS (SELECT 1 FROM Usuarios WHERE username = p_username) THEN
        SET p_nuevo_id = 0;
        SET p_mensaje  = 'ERROR: El username ya existe.';
    ELSEIF EXISTS (SELECT 1 FROM Usuarios WHERE id_empleado = p_id_empleado) THEN
        SET p_nuevo_id = 0;
        SET p_mensaje  = 'ERROR: El empleado ya tiene un usuario asignado.';
    ELSEIF NOT EXISTS (SELECT 1 FROM Empleados WHERE id = p_id_empleado AND estado = 1) THEN
        SET p_nuevo_id = 0;
        SET p_mensaje  = 'ERROR: Empleado no existe o está inactivo.';
    ELSE
        INSERT INTO Usuarios (username, password_hash, id_empleado, rol)
        VALUES (p_username, p_password_hash, p_id_empleado, p_rol);

        SET p_nuevo_id = LAST_INSERT_ID();
        SET p_mensaje  = CONCAT('OK: Usuario creado con ID ', p_nuevo_id);
    END IF;
END$$

-- ---- Leer Usuario por ID ----
DROP PROCEDURE IF EXISTS SP_Usuario_LeerPorId$$
CREATE PROCEDURE SP_Usuario_LeerPorId(
    IN p_id INT UNSIGNED
)
BEGIN
    SELECT
        u.id, u.username, u.rol, u.ultimo_acceso, u.estado,
        e.id       AS id_empleado,
        e.dni,
        CONCAT(e.nombres, ' ', e.apellidos) AS nombre_empleado,
        c.nombre   AS cargo
    FROM Usuarios  u
    INNER JOIN Empleados e ON e.id = u.id_empleado
    INNER JOIN Cargos    c ON c.id = e.id_cargo
    WHERE u.id = p_id;
END$$

-- ---- Cambiar Password ----
DROP PROCEDURE IF EXISTS SP_Usuario_CambiarPassword$$
CREATE PROCEDURE SP_Usuario_CambiarPassword(
    IN  p_id_usuario        INT UNSIGNED,
    IN  p_nuevo_hash        CHAR(60),
    OUT p_mensaje           VARCHAR(200)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = p_id_usuario AND estado = 1) THEN
        SET p_mensaje = 'ERROR: Usuario no encontrado o inactivo.';
    ELSE
        UPDATE Usuarios
        SET password_hash = p_nuevo_hash
        WHERE id = p_id_usuario;

        SET p_mensaje = 'OK: Contraseña actualizada.';
    END IF;
END$$

-- ---- Desactivar Usuario ----
DROP PROCEDURE IF EXISTS SP_Usuario_Desactivar$$
CREATE PROCEDURE SP_Usuario_Desactivar(
    IN  p_id_usuario   INT UNSIGNED,
    OUT p_mensaje      VARCHAR(200)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = p_id_usuario) THEN
        SET p_mensaje = 'ERROR: Usuario no encontrado.';
    ELSE
        UPDATE Usuarios SET estado = 0 WHERE id = p_id_usuario;
        SET p_mensaje = 'OK: Usuario desactivado.';
    END IF;
END$$


-- ============================================================
-- 6.D  CRUD DE PRODUCTOS
-- ============================================================

-- ---- Insertar Producto ----
DROP PROCEDURE IF EXISTS SP_Producto_Insertar$$
CREATE PROCEDURE SP_Producto_Insertar(
    IN  p_id_laboratorio        INT UNSIGNED,
    IN  p_id_categoria          INT UNSIGNED,
    IN  p_id_presentacion       INT UNSIGNED,
    IN  p_id_via_administracion INT UNSIGNED,
    IN  p_nombre_comercial      VARCHAR(150),
    IN  p_principio_activo      VARCHAR(200),
    IN  p_concentracion         VARCHAR(50),
    IN  p_codigo_barras         VARCHAR(50),
    IN  p_stock_actual          DECIMAL(10,2),
    IN  p_stock_minimo          DECIMAL(10,2),
    IN  p_requiere_receta       TINYINT(1),
    IN  p_fecha_vencimiento     DATE,
    OUT p_nuevo_id              INT UNSIGNED,
    OUT p_mensaje               VARCHAR(200)
)
BEGIN
    IF p_codigo_barras IS NOT NULL AND EXISTS (
        SELECT 1 FROM Productos WHERE codigo_barras = p_codigo_barras
    ) THEN
        SET p_nuevo_id = 0;
        SET p_mensaje  = 'ERROR: El código de barras ya está registrado.';
    ELSE
        INSERT INTO Productos (
            id_laboratorio, id_categoria, id_presentacion, id_via_administracion,
            nombre_comercial, principio_activo, concentracion, codigo_barras,
            stock_actual, stock_minimo, requiere_receta, fecha_vencimiento
        ) VALUES (
            p_id_laboratorio, p_id_categoria, p_id_presentacion, p_id_via_administracion,
            p_nombre_comercial, p_principio_activo, p_concentracion, p_codigo_barras,
            p_stock_actual, p_stock_minimo, p_requiere_receta, p_fecha_vencimiento
        );

        SET p_nuevo_id = LAST_INSERT_ID();
        SET p_mensaje  = CONCAT('OK: Producto creado con ID ', p_nuevo_id);
    END IF;
END$$

-- ---- Leer Producto por ID ----
DROP PROCEDURE IF EXISTS SP_Producto_LeerPorId$$
CREATE PROCEDURE SP_Producto_LeerPorId(
    IN p_id INT UNSIGNED
)
BEGIN
    SELECT
        p.id,
        p.nombre_comercial,
        p.principio_activo,
        p.concentracion,
        p.codigo_barras,
        p.stock_actual,
        p.stock_minimo,
        p.requiere_receta,
        p.fecha_vencimiento,
        p.estado,
        l.nombre  AS laboratorio,
        ca.nombre AS categoria,
        pr.nombre AS presentacion,
        va.nombre AS via_administracion
    FROM Productos p
    LEFT JOIN Laboratorios     l  ON l.id  = p.id_laboratorio
    LEFT JOIN Categorias       ca ON ca.id = p.id_categoria
    LEFT JOIN Presentaciones   pr ON pr.id = p.id_presentacion
    LEFT JOIN Vias_Administracion va ON va.id = p.id_via_administracion
    WHERE p.id = p_id;

    -- También retornar los precios asociados
    SELECT
        pp.id,
        pp.descripcion,
        pp.cantidad_equivalente,
        pp.precio_venta,
        pp.precio_costo,
        pp.es_precio_default,
        um.nombre AS unidad_medida
    FROM Productos_Precios pp
    INNER JOIN Unidades_Medida um ON um.id = pp.id_unidad
    WHERE pp.id_producto = p_id AND pp.estado = 1;
END$$

-- ---- Buscar Productos (para buscador en frontend) ----
DROP PROCEDURE IF EXISTS SP_Producto_Buscar$$
CREATE PROCEDURE SP_Producto_Buscar(
    IN p_termino VARCHAR(100)
)
BEGIN
    SELECT
        p.id,
        p.nombre_comercial,
        p.principio_activo,
        p.concentracion,
        p.stock_actual,
        p.codigo_barras,
        ca.nombre  AS categoria,
        pr.nombre  AS presentacion,
        pp.precio_venta,
        um.nombre  AS unidad_venta
    FROM Productos p
    INNER JOIN Categorias      ca ON ca.id = p.id_categoria
    INNER JOIN Presentaciones  pr ON pr.id = p.id_presentacion
    LEFT JOIN Productos_Precios pp ON pp.id_producto = p.id AND pp.es_precio_default = 1 AND pp.estado = 1
    LEFT JOIN Unidades_Medida  um ON um.id = pp.id_unidad
    WHERE p.estado = 1
      AND (
          p.nombre_comercial  LIKE CONCAT('%', p_termino, '%')
          OR p.principio_activo LIKE CONCAT('%', p_termino, '%')
          OR p.codigo_barras    = p_termino
      )
    ORDER BY p.nombre_comercial
    LIMIT 50;
END$$

-- ---- Actualizar Stock (entrada/ajuste manual) ----
DROP PROCEDURE IF EXISTS SP_Producto_ActualizarStock$$
CREATE PROCEDURE SP_Producto_ActualizarStock(
    IN  p_id_producto   INT UNSIGNED,
    IN  p_cantidad      DECIMAL(10,2),
    IN  p_tipo          ENUM('entrada','salida','ajuste'),
    IN  p_motivo        VARCHAR(100),
    IN  p_id_usuario    INT UNSIGNED,
    OUT p_mensaje       VARCHAR(200)
)
BEGIN
    DECLARE v_stock_actual DECIMAL(10,2) DEFAULT 0;
    DECLARE v_stock_nuevo  DECIMAL(10,2) DEFAULT 0;

    SELECT stock_actual INTO v_stock_actual
    FROM Productos WHERE id = p_id_producto AND estado = 1;

    IF v_stock_actual IS NULL THEN
        SET p_mensaje = 'ERROR: Producto no encontrado o inactivo.';
    ELSE
        CASE p_tipo
            WHEN 'entrada'  THEN SET v_stock_nuevo = v_stock_actual + p_cantidad;
            WHEN 'salida'   THEN SET v_stock_nuevo = v_stock_actual - p_cantidad;
            WHEN 'ajuste'   THEN SET v_stock_nuevo = p_cantidad;
        END CASE;

        IF v_stock_nuevo < 0 THEN
            SET p_mensaje = 'ERROR: Stock insuficiente para realizar la salida.';
        ELSE
            UPDATE Productos SET stock_actual = v_stock_nuevo WHERE id = p_id_producto;

            INSERT INTO Movimientos_Stock
                (id_producto, tipo_movimiento, cantidad, stock_anterior, stock_resultante, motivo, id_usuario)
            VALUES
                (p_id_producto, p_tipo, p_cantidad, v_stock_actual, v_stock_nuevo, p_motivo, p_id_usuario);

            SET p_mensaje = CONCAT('OK: Stock actualizado de ', v_stock_actual, ' a ', v_stock_nuevo);
        END IF;
    END IF;
END$$

-- ---- Actualizar datos del Producto ----
DROP PROCEDURE IF EXISTS SP_Producto_Actualizar$$
CREATE PROCEDURE SP_Producto_Actualizar(
    IN  p_id                    INT UNSIGNED,
    IN  p_id_laboratorio        INT UNSIGNED,
    IN  p_id_categoria          INT UNSIGNED,
    IN  p_id_presentacion       INT UNSIGNED,
    IN  p_id_via_administracion INT UNSIGNED,
    IN  p_nombre_comercial      VARCHAR(150),
    IN  p_principio_activo      VARCHAR(200),
    IN  p_concentracion         VARCHAR(50),
    IN  p_stock_minimo          DECIMAL(10,2),
    IN  p_requiere_receta       TINYINT(1),
    IN  p_fecha_vencimiento     DATE,
    OUT p_mensaje               VARCHAR(200)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = p_id) THEN
        SET p_mensaje = 'ERROR: Producto no encontrado.';
    ELSE
        UPDATE Productos
        SET id_laboratorio        = p_id_laboratorio,
            id_categoria          = p_id_categoria,
            id_presentacion       = p_id_presentacion,
            id_via_administracion = p_id_via_administracion,
            nombre_comercial      = p_nombre_comercial,
            principio_activo      = p_principio_activo,
            concentracion         = p_concentracion,
            stock_minimo          = p_stock_minimo,
            requiere_receta       = p_requiere_receta,
            fecha_vencimiento     = p_fecha_vencimiento
        WHERE id = p_id;

        SET p_mensaje = 'OK: Producto actualizado.';
    END IF;
END$$

-- ---- Desactivar Producto (baja lógica) ----
DROP PROCEDURE IF EXISTS SP_Producto_Desactivar$$
CREATE PROCEDURE SP_Producto_Desactivar(
    IN  p_id       INT UNSIGNED,
    OUT p_mensaje  VARCHAR(200)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = p_id) THEN
        SET p_mensaje = 'ERROR: Producto no encontrado.';
    ELSE
        UPDATE Productos SET estado = 0 WHERE id = p_id;
        SET p_mensaje = 'OK: Producto descontinuado.';
    END IF;
END$$

-- ---- Listar Productos con Stock Bajo ----
DROP PROCEDURE IF EXISTS SP_Producto_StockBajo$$
CREATE PROCEDURE SP_Producto_StockBajo()
BEGIN
    SELECT
        p.id,
        p.nombre_comercial,
        p.stock_actual,
        p.stock_minimo,
        (p.stock_minimo - p.stock_actual) AS unidades_faltantes,
        l.nombre AS laboratorio
    FROM Productos p
    INNER JOIN Laboratorios l ON l.id = p.id_laboratorio
    WHERE p.estado = 1
      AND p.stock_actual <= p.stock_minimo
    ORDER BY unidades_faltantes DESC;
END$$


-- ============================================================
-- 6.E  PROCESO TRANSACCIONAL: GENERAR VENTA
-- ============================================================
-- Recibe la cabecera y un JSON con el detalle de ítems.
-- Ejemplo de JSON de detalle:
-- '[{"id_producto":1,"id_producto_precio":2,"cantidad":3,"precio_unitario":5.50,"descuento":0},...]'
-- ============================================================
DROP PROCEDURE IF EXISTS SP_Generar_Venta$$
CREATE PROCEDURE SP_Generar_Venta(
    IN  p_id_tipo_comprobante   INT UNSIGNED,
    IN  p_id_cliente            INT UNSIGNED,
    IN  p_id_usuario            INT UNSIGNED,
    IN  p_tipo_pago             ENUM('efectivo','tarjeta','transferencia','mixto'),
    IN  p_monto_pagado          DECIMAL(10,2),
    IN  p_observaciones         VARCHAR(255),
    IN  p_detalle_json          JSON,       -- Array de ítems
    OUT p_id_venta              INT UNSIGNED,
    OUT p_numero_comprobante    VARCHAR(20),
    OUT p_mensaje               VARCHAR(200)
)
-- FIX #1308: El bloque BEGIN debe llevar etiqueta para que LEAVE funcione
SP_Generar_Venta: BEGIN
    -- Variables de control
    DECLARE v_serie         CHAR(4);
    DECLARE v_correlativo   INT UNSIGNED;
    DECLARE v_num_str       CHAR(8);
    DECLARE v_total         DECIMAL(10,2) DEFAULT 0;
    DECLARE v_subtotal_vta  DECIMAL(10,2) DEFAULT 0;
    DECLARE v_igv           DECIMAL(10,2) DEFAULT 0;
    DECLARE v_vuelto        DECIMAL(10,2) DEFAULT 0;
    DECLARE v_n_items       INT DEFAULT 0;

    -- Variables para recorrer el JSON
    DECLARE v_idx           INT DEFAULT 0;
    DECLARE v_id_prod       INT UNSIGNED;
    DECLARE v_id_pp         INT UNSIGNED;
    DECLARE v_cantidad      DECIMAL(10,3);
    DECLARE v_precio_unit   DECIMAL(10,2);
    DECLARE v_descuento     DECIMAL(10,2);
    DECLARE v_subtotal_item DECIMAL(10,2);
    DECLARE v_stock_actual  DECIMAL(10,2);
    DECLARE v_cant_equiv    DECIMAL(10,3);

    -- Manejo de errores
    DECLARE v_error_msg     VARCHAR(200) DEFAULT '';
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_id_venta           = 0;
        SET p_numero_comprobante = '';
        SET p_mensaje            = CONCAT('ERROR TRANSACCIONAL: ', v_error_msg);
    END;

    -- ----------------------------------------------------------------
    -- Validaciones previas (fuera de transacción)
    -- ----------------------------------------------------------------
    SET v_n_items = JSON_LENGTH(p_detalle_json);

    IF v_n_items IS NULL OR v_n_items = 0 THEN
        SET p_id_venta           = 0;
        SET p_numero_comprobante = '';
        SET p_mensaje            = 'ERROR: El detalle de la venta está vacío.';
        LEAVE SP_Generar_Venta;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM Tipos_Comprobantes WHERE id = p_id_tipo_comprobante AND estado = 1) THEN
        SET p_id_venta           = 0;
        SET p_numero_comprobante = '';
        SET p_mensaje            = 'ERROR: Tipo de comprobante inválido.';
        LEAVE SP_Generar_Venta;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = p_id_usuario AND estado = 1) THEN
        SET p_id_venta           = 0;
        SET p_numero_comprobante = '';
        SET p_mensaje            = 'ERROR: Usuario no válido.';
        LEAVE SP_Generar_Venta;
    END IF;

    -- Verificar stock de todos los ítems antes de empezar
    SET v_idx = 0;
    WHILE v_idx < v_n_items DO
        SET v_id_prod   = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].id_producto')));
        SET v_id_pp     = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].id_producto_precio')));
        SET v_cantidad  = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad')));

        -- Obtener cantidad equivalente en unidades base
        SELECT pp.cantidad_equivalente INTO v_cant_equiv
        FROM Productos_Precios pp
        WHERE pp.id = v_id_pp AND pp.id_producto = v_id_prod AND pp.estado = 1;

        SELECT p.stock_actual INTO v_stock_actual
        FROM Productos p
        WHERE p.id = v_id_prod AND p.estado = 1;

        IF v_stock_actual IS NULL THEN
            SET p_id_venta           = 0;
            SET p_numero_comprobante = '';
            SET p_mensaje            = CONCAT('ERROR: Producto ID ', v_id_prod, ' no encontrado o inactivo.');
            LEAVE SP_Generar_Venta;
        END IF;

        IF (v_cantidad * v_cant_equiv) > v_stock_actual THEN
            SET p_id_venta           = 0;
            SET p_numero_comprobante = '';
            SET p_mensaje            = CONCAT('ERROR: Stock insuficiente para producto ID ', v_id_prod,
                                              '. Stock disponible: ', v_stock_actual);
            LEAVE SP_Generar_Venta;
        END IF;

        SET v_idx = v_idx + 1;
    END WHILE;

    -- ----------------------------------------------------------------
    -- TRANSACCIÓN
    -- ----------------------------------------------------------------
    START TRANSACTION;

        -- 1. Obtener y bloquear el tipo de comprobante
        SELECT serie_actual, (correlativo_actual + 1)
        INTO   v_serie, v_correlativo
        FROM   Tipos_Comprobantes
        WHERE  id = p_id_tipo_comprobante
        FOR UPDATE;

        SET v_num_str = LPAD(v_correlativo, 8, '0');

        -- 2. Calcular totales desde el JSON
        SET v_idx   = 0;
        SET v_total = 0;

        WHILE v_idx < v_n_items DO
            SET v_precio_unit   = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].precio_unitario')));
            SET v_cantidad      = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad')));
            SET v_descuento     = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].descuento'))), 0);
            SET v_subtotal_item = ROUND((v_cantidad * v_precio_unit) - v_descuento, 2);
            SET v_total         = v_total + v_subtotal_item;
            SET v_idx           = v_idx + 1;
        END WHILE;

        -- IGV 18% (ajusta según tu régimen fiscal)
        SET v_subtotal_vta = ROUND(v_total / 1.18, 2);
        SET v_igv          = v_total - v_subtotal_vta;
        SET v_vuelto       = IF(p_monto_pagado IS NOT NULL AND p_monto_pagado >= v_total,
                                p_monto_pagado - v_total, 0);

        -- 3. Insertar cabecera de venta
        INSERT INTO Ventas (
            id_tipo_comprobante, serie_documento, numero_documento,
            id_cliente, id_usuario, subtotal, igv, total,
            tipo_pago, monto_pagado, vuelto, observaciones
        ) VALUES (
            p_id_tipo_comprobante, v_serie, v_num_str,
            p_id_cliente, p_id_usuario, v_subtotal_vta, v_igv, v_total,
            p_tipo_pago, p_monto_pagado, v_vuelto, p_observaciones
        );

        SET p_id_venta = LAST_INSERT_ID();

        -- 4. Insertar detalle y descontar stock
        SET v_idx = 0;

        WHILE v_idx < v_n_items DO
            SET v_id_prod     = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].id_producto')));
            SET v_id_pp       = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].id_producto_precio')));
            SET v_cantidad    = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad')));
            SET v_precio_unit = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].precio_unitario')));
            SET v_descuento   = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].descuento'))), 0);
            SET v_subtotal_item = ROUND((v_cantidad * v_precio_unit) - v_descuento, 2);

            -- Insertar línea de detalle
            INSERT INTO Detalle_Ventas (id_venta, id_producto, id_producto_precio, cantidad, precio_unitario, descuento, subtotal)
            VALUES (p_id_venta, v_id_prod, v_id_pp, v_cantidad, v_precio_unit, v_descuento, v_subtotal_item);

            -- Obtener cantidad equivalente en unidades base para descontar
            SELECT cantidad_equivalente INTO v_cant_equiv
            FROM Productos_Precios WHERE id = v_id_pp;

            -- Descontar stock
            SELECT stock_actual INTO v_stock_actual FROM Productos WHERE id = v_id_prod FOR UPDATE;

            UPDATE Productos
            SET stock_actual = stock_actual - (v_cantidad * v_cant_equiv)
            WHERE id = v_id_prod;

            -- Registrar movimiento de stock
            INSERT INTO Movimientos_Stock
                (id_producto, tipo_movimiento, cantidad, stock_anterior,
                 stock_resultante, motivo, id_referencia, id_usuario)
            VALUES
                (v_id_prod, 'salida', (v_cantidad * v_cant_equiv), v_stock_actual,
                 v_stock_actual - (v_cantidad * v_cant_equiv),
                 'Venta', p_id_venta, p_id_usuario);

            SET v_idx = v_idx + 1;
        END WHILE;

        -- 5. Actualizar correlativo del comprobante
        UPDATE Tipos_Comprobantes
        SET correlativo_actual = v_correlativo
        WHERE id = p_id_tipo_comprobante;

    COMMIT;

    SET p_numero_comprobante = CONCAT(v_serie, '-', v_num_str);
    SET p_mensaje            = CONCAT('OK: Venta generada. Comprobante: ', p_numero_comprobante);
-- FIX #1308: Cierre del bloque etiquetado
END SP_Generar_Venta$$


-- ============================================================
-- 6.F  REPORTES Y CONSULTAS FRECUENTES
-- ============================================================

-- ---- Ventas por Rango de Fechas ----
DROP PROCEDURE IF EXISTS SP_Reporte_VentasPorFecha$$
CREATE PROCEDURE SP_Reporte_VentasPorFecha(
    IN p_fecha_inicio   DATE,
    IN p_fecha_fin      DATE,
    IN p_id_usuario     INT UNSIGNED   -- NULL para todos los usuarios
)
BEGIN
    SELECT
        v.id,
        CONCAT(tc.serie_actual, '-', v.numero_documento) AS comprobante,
        tc.nombre_documento,
        v.fecha_hora,
        c.nombres_razon_social  AS cliente,
        CONCAT(e.nombres, ' ', e.apellidos) AS vendedor,
        v.subtotal,
        v.igv,
        v.total,
        v.tipo_pago,
        v.estado
    FROM Ventas v
    INNER JOIN Tipos_Comprobantes tc ON tc.id = v.id_tipo_comprobante
    INNER JOIN Clientes           c  ON c.id  = v.id_cliente
    INNER JOIN Usuarios           u  ON u.id  = v.id_usuario
    INNER JOIN Empleados          e  ON e.id  = u.id_empleado
    WHERE DATE(v.fecha_hora) BETWEEN p_fecha_inicio AND p_fecha_fin
      AND (p_id_usuario IS NULL OR v.id_usuario = p_id_usuario)
      AND v.estado = 'emitida'
    ORDER BY v.fecha_hora DESC;
END$$

-- ---- Detalle de una Venta ----
DROP PROCEDURE IF EXISTS SP_Venta_LeerDetalle$$
CREATE PROCEDURE SP_Venta_LeerDetalle(
    IN p_id_venta INT UNSIGNED
)
BEGIN
    -- Cabecera
    SELECT
        v.id,
        CONCAT(v.serie_documento, '-', v.numero_documento) AS comprobante,
        tc.nombre_documento,
        v.fecha_hora,
        c.nombres_razon_social AS cliente,
        c.numero_documento     AS doc_cliente,
        CONCAT(e.nombres, ' ', e.apellidos) AS vendedor,
        v.subtotal, v.igv, v.total,
        v.tipo_pago, v.monto_pagado, v.vuelto,
        v.observaciones, v.estado
    FROM Ventas v
    INNER JOIN Tipos_Comprobantes tc ON tc.id = v.id_tipo_comprobante
    INNER JOIN Clientes           c  ON c.id  = v.id_cliente
    INNER JOIN Usuarios           u  ON u.id  = v.id_usuario
    INNER JOIN Empleados          e  ON e.id  = u.id_empleado
    WHERE v.id = p_id_venta;

    -- Detalle
    SELECT
        dv.id,
        p.nombre_comercial,
        p.principio_activo,
        pp.descripcion         AS presentacion_venta,
        dv.cantidad,
        dv.precio_unitario,
        dv.descuento,
        dv.subtotal
    FROM Detalle_Ventas dv
    INNER JOIN Productos        p  ON p.id  = dv.id_producto
    INNER JOIN Productos_Precios pp ON pp.id = dv.id_producto_precio
    WHERE dv.id_venta = p_id_venta;
END$$

-- ---- Productos por Vencer (próximos N días) ----
DROP PROCEDURE IF EXISTS SP_Producto_PorVencer$$
CREATE PROCEDURE SP_Producto_PorVencer(
    IN p_dias INT  -- Ej: 30 días
)
BEGIN
    SELECT
        p.id,
        p.nombre_comercial,
        p.principio_activo,
        p.stock_actual,
        p.fecha_vencimiento,
        DATEDIFF(p.fecha_vencimiento, CURDATE()) AS dias_para_vencer,
        l.nombre AS laboratorio
    FROM Productos p
    INNER JOIN Laboratorios l ON l.id = p.id_laboratorio
    WHERE p.estado = 1
      AND p.fecha_vencimiento IS NOT NULL
      AND p.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL p_dias DAY)
    ORDER BY p.fecha_vencimiento ASC;
END$$


DELIMITER ;


-- =============================================================================
-- VERIFICACIÓN FINAL
-- =============================================================================
SELECT
    TABLE_NAME     AS `Tabla`,
    TABLE_ROWS     AS `Filas_aprox`,
    TABLE_COMMENT  AS `Descripcion`
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'nova_salud'
ORDER BY TABLE_NAME;

SELECT
    ROUTINE_NAME   AS `Stored_Procedure`,
    ROUTINE_TYPE   AS `Tipo`,
    CREATED        AS `Creado`
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'nova_salud'
ORDER BY ROUTINE_NAME;