# 🏗️ Arquitectura de Nova Salud Backend

## Flujo de Datos

```
┌─────────────┐
│   CLIENTE   │ (Frontend React / Postman / cURL)
└──────┬──────┘
       │
       │ HTTP Request
       ↓
┌──────────────────────────────────────────┐
│       EXPRESS SERVER (src/index.ts)      │
│  ┌────────────────────────────────────┐  │
│  │  Middlewares:                      │  │
│  │  • CORS                            │  │
│  │  • Body Parser                     │  │
│  │  • Logs                            │  │
│  └────────────────────────────────────┘  │
└──────────────┬───────────────────────────┘
               │
         ┌─────┴─────┐
         │           │
    ┌────▼─────┐  ┌──▼──────────┐
    │   AUTH   │  │  PRODUCTOS  │
    │  Routes  │  │   Routes    │
    └────┬─────┘  └──┬──────────┘
         │           │
    ┌────▼──────────┬┴────────────────┐
    │               │                 │
┌───▼───────────┐ ┌┴────────────┐  ┌─▼───────────────┐
│ AUTH          │ │ PRODUCTOS   │  │ UTILS/RESPONSES │
│ CONTROLLER    │ │ CONTROLLER  │  │ (Error Handler) │
│               │ │             │  │                 │
│ • login()     │ │ • listar()  │  │ • sendSuccess   │
│   SP_Login    │ │ • precios() │  │ • sendError     │
│               │ │   SP_Producto │ │ • handleError   │
└───┬───────────┘ │   SP_Precios │ └─────────────────┘
    │             └─────┬────────┘
    │                   │
    └───────────┬───────┘
                │
    ┌───────────▼──────────────┐
    │  DB Config (src/config)  │
    │  ┌────────────────────┐  │
    │  │ MySQL Pool         │  │
    │  │ (mysql2/promise)   │  │
    │  │                    │  │
    │  │ executeStored      │  │
    │  │ Procedure()        │  │
    │  └────────────────────┘  │
    └───────────┬──────────────┘
                │
    ┌───────────▼──────────────────────────────────────┐
    │        MYSQL DATABASE                            │
    │        BoticaNovaSalud_Final                      │
    │  ┌─────────────────────────────────────────────┐ │
    │  │ Stored Procedures:                          │ │
    │  │ • SP_Login(username)                        │ │
    │  │ • SP_Producto_Listar()                      │ │
    │  │ • SP_Producto_Precios(id_producto)          │ │
    │  │ • SP_Venta_Crear(...)                       │ │
    │  │ • SP_Compra_Crear(...)                      │ │
    │  │                                             │ │
    │  │ Tables:                                     │ │
    │  │ • Usuarios                                  │ │
    │  │ • Empleados / Cargos                        │ │
    │  │ • Productos / Categorias / Laboratorios     │ │
    │  │ • Presentaciones / Unidades_Medida          │ │
    │  │ • Lotes                                     │ │
    │  │ • Productos_Precios                         │ │
    │  │ • Ventas / Detalle_Ventas                   │ │
    │  │ • Compras / Detalle_Compras                 │ │
    │  └─────────────────────────────────────────────┘ │
    └──────────────────────────────────────────────────┘
```

---

## Estructura de Archivos Detallada

```
backend/
│
├── src/
│   ├── config/
│   │   └── db.ts
│   │       ├── Crea pool de conexiones MySQL
│   │       ├── Función testConnection()
│   │       └── Función executeStoredProcedure()
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   │   └── login(req, res) → SP_Login
│   │   │
│   │   └── producto.controller.ts
│   │       ├── listarProductos(req, res) → SP_Producto_Listar
│   │       └── obtenerPreciosProducto(req, res) → SP_Producto_Precios
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   │   └── POST /api/auth/login
│   │   │
│   │   └── producto.routes.ts
│   │       ├── GET /api/producto/listar
│   │       └── GET /api/producto/:id_producto/precios
│   │
│   ├── types/
│   │   └── index.ts
│   │       ├── LoginResponse
│   │       ├── ProductoListar
│   │       ├── ProductoPrecio
│   │       ├── VentaCrear
│   │       ├── CompraCrear
│   │       ├── LoginRequest
│   │       └── ApiResponse<T>
│   │
│   ├── utils/
│   │   └── responses.ts
│   │       ├── sendSuccess<T>()
│   │       ├── sendError()
│   │       └── handleError()
│   │
│   └── index.ts
│       ├── Configurar Express
│       ├── Middlewares (CORS, bodyParser, logs)
│       ├── Registrar rutas
│       └── Iniciar servidor
│
├── dist/ (generado al compilar)
├── node_modules/
├── .env (local - no versionado)
├── .env.example
├── .gitignore
├── tsconfig.json
├── package.json
├── package-lock.json
├── README.md
└── API_TESTING.md
```

---

## Flujo de Solicitud Típica: LOGIN

```
1. Cliente envía:
   POST /api/auth/login
   { "username": "admin", "password": "pass123" }

2. Express llama a auth.routes.ts
   → router.post('/login', login)

3. Se ejecuta auth.controller.ts → login()
   ├── Valida que username y password existan
   ├── Llama a executeStoredProcedure('SP_Login', [username])
   ├── Verifica contraseña con bcryptjs.compare()
   ├── Genera JWT token
   └── Devuelve respuesta con token

4. Si error, handleError() devuelve:
   {
     "success": false,
     "message": "...",
     "error": "..."
   }

5. Si éxito, sendSuccess() devuelve:
   {
     "success": true,
     "data": { token, user },
     "message": "Login exitoso"
   }
```

---

## Flujo de Solicitud Típica: LISTAR PRODUCTOS

```
1. Cliente envía:
   GET /api/producto/listar

2. Express llama a producto.routes.ts
   → router.get('/listar', listarProductos)

3. Se ejecuta producto.controller.ts → listarProductos()
   ├── Llama a executeStoredProcedure('SP_Producto_Listar', [])
   ├── Verifica que resultados existan
   └── Devuelve respuesta

4. Si éxito, sendSuccess() devuelve:
   {
     "success": true,
     "data": [
       {
         "id_producto": 1,
         "nombre_comercial": "...",
         ...
       }
     ],
     "message": "Productos listados exitosamente"
   }
```

---

## Princip del Proyecto

✅ **Arquitectura en Capas:**
- Routes → Controllers → DB Config → MySQL SPs

✅ **Type Safety:**
- TypeScript strict mode habilitado
- Interfaces para todas las respuestas de SPs

✅ **Error Handling:**
- Try-catch en todos los controladores
- Respuestas de error estandarizadas
- Códigos HTTP correctos (200, 400, 401, 500)

✅ **Seguridad:**
- JWT para autenticación
- Bcryptjs para hashing de contraseñas
- CORS configurado
- Variables de entorno protegidas

✅ **Mantenibilidad:**
- Código limpio y legible
- Funciones pequeñas y enfocadas
- Reutilización de middleware
- Fácil de escalar

---

## Próximas Características a Agregar

```
[ ] Middleware de autenticación JWT
[ ] SP_Venta_Crear → Crear ventas
[ ] SP_Compra_Crear → Registrar compras
[ ] Validaciones más estrictas
[ ] Tests unitarios (Jest)
[ ] Documentación Swagger
[ ] Rate limiting
[ ] Logs persistentes
```

---

**API lista para conectar con Frontend React 🚀**
