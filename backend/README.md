# 🏥 Nova Salud - API Backend

API REST para el sistema de gestión de la botica "Nova Salud" construida con Node.js, Express y TypeScript.

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── db.ts              # Configuración de conexión MySQL
│   ├── controllers/
│   │   ├── auth.controller.ts # Controlador de autenticación
│   │   └── producto.controller.ts # Controlador de productos
│   ├── routes/
│   │   ├── auth.routes.ts     # Rutas de autenticación
│   │   └── producto.routes.ts # Rutas de productos
│   ├── types/
│   │   └── index.ts           # Interfaces y tipos TypeScript
│   ├── utils/
│   │   └── responses.ts       # Middleware de respuestas HTTP
│   └── index.ts               # Archivo principal del servidor
├── dist/                       # Código compilado (creado al buildear)
├── node_modules/
├── .env                        # Variables de entorno (NO SUBIR A GIT)
├── .env.example               # Template de .env
├── .gitignore
├── tsconfig.json
└── package.json
```

## 🚀 Instalación y Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Edita el archivo `.env` con tus credenciales de MySQL:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=BoticaNovaSalud_Final
PORT=3000
JWT_SECRET=tu_jwt_secret_aqui
```

### 3. Ejecutar en modo desarrollo
```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:3000`

## 🛠️ Scripts disponibles

- **`npm run dev`** - Ejecuta en modo desarrollo con hot reload
- **`npm run build`** - Compila TypeScript a JavaScript
- **`npm run start`** - Ejecuta el servidor en producción

## 📡 Endpoints disponibles

### Autenticación

#### POST `/api/auth/login`
Autentica un usuario usando `SP_Login`

**Request:**
```json
{
  "username": "usuario123",
  "password": "contraseña123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id_usuario": 1,
      "username": "usuario123",
      "nombres": "Juan",
      "apellidos": "Pérez",
      "cargo": "Vendedor"
    }
  },
  "message": "Login exitoso"
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Usuario o contraseña incorrectos"
}
```

### Productos

#### GET `/api/producto/listar`
Obtiene el listado completo de productos usando `SP_Producto_Listar`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id_producto": 1,
      "nombre_comercial": "Amoxicilina 500mg",
      "principio_activo": "Amoxicilina",
      "nombre_categoria": "Antibióticos",
      "nombre_laboratorio": "Pfizer",
      "nombre_presentacion": "Pastilla",
      "stock_actual_unidades": 150,
      "proximo_vencimiento": "2025-12-31"
    }
  ],
  "message": "Productos listados exitosamente"
}
```

#### GET `/api/producto/:id_producto/precios`
Obtiene los precios disponibles de un producto usando `SP_Producto_Precios`

**Ejemplo:** `GET /api/producto/1/precios`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id_producto_precio": 1,
      "nombre_unidad": "Unidad",
      "cantidad_equivalente": 1,
      "precio_venta": 2.50
    },
    {
      "id_producto_precio": 2,
      "nombre_unidad": "Caja",
      "cantidad_equivalente": 100,
      "precio_venta": 200.00
    }
  ],
  "message": "Precios obtenidos exitosamente"
}
```

#### GET `/health`
Verifica el estado del servidor

**Response:**
```json
{
  "status": "API funcionando ✅"
}
```

## ⚙️ Características técnicas

✅ **Express** con TypeScript  
✅ **MySQL 2 con Promises** - Pool de conexiones  
✅ **Stored Procedures** - Única forma de acceder a datos  
✅ **JWT** - Autenticación de usuarios  
✅ **Bcrypt** - Hash de contraseñas  
✅ **CORS** - Soporte para requests del frontend  
✅ **Dotenv** - Gestión de variables de entorno  
✅ **Respuestas estandarizadas** - Formato JSON consistente  

## 🔐 Seguridad

- Las credenciales de BD están en `.env` (no se suben a Git)
- Las contraseñas se hashean con bcryptjs
- Los tokens JWT expiran cada 24 horas
- Manejo centralizado de errores
- Validación de entrada en todos los endpoints

## 📝 Notas importantes

1. **Stored Procedures:** Todos los datos se obtienen EXCLUSIVAMENTE mediante SPs. Cero queries directas en los controladores.
2. **Tipos TypeScript:** Utiliza interfaces basadas en la estructura de BD para máxima seguridad de tipos.
3. **Error Handling:** Los errores se capturan con try-catch y se devuelven en formato JSON estandarizado.
4. **Pool de Conexiones:** Usa conexión pooled para mejor rendimiento.

## 🔄 Próximos pasos

- [ ] Agregar middleware de autenticación (verificar JWT)
- [ ] Implementar SP_Venta_Crear y SP_Compra_Crear
- [ ] Agregar validaciones más estrictas
- [ ] Tests unitarios con Jest
- [ ] Documentación con Swagger

---

**Desarrollado con ❤️ para Nova Salud**
