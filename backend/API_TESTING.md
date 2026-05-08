# 📝 Ejemplos de Prueba de API

## Usando cURL

### 1. Health Check
```bash
curl -X GET http://localhost:3000/health
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

### 3. Listar Productos
```bash
curl -X GET http://localhost:3000/api/producto/listar \
  -H "Content-Type: application/json"
```

### 4. Obtener Precios de un Producto
```bash
curl -X GET http://localhost:3000/api/producto/1/precios \
  -H "Content-Type: application/json"
```

---

## Usando Postman

### Configurar Postman

1. **Crear una Nueva Collection** llamada "Nova Salud API"

2. **Variables de Entorno:**
   - `base_url`: `http://localhost:3000`
   - `token`: (se llenará automáticamente tras login)

---

### Request 1: Health Check
```
Method: GET
URL: {{base_url}}/health
```

**Expected Response (200):**
```json
{
  "status": "API funcionando ✅"
}
```

---

### Request 2: Login
```
Method: POST
URL: {{base_url}}/api/auth/login
Headers:
  Content-Type: application/json

Body (raw):
{
  "username": "admin",
  "password": "password123"
}
```

**Tests (Script):**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
    console.log("✅ Token guardado: " + jsonData.data.token);
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id_usuario": 1,
      "username": "admin",
      "nombres": "Administrador",
      "apellidos": "Sistema",
      "cargo": "Admin"
    }
  },
  "message": "Login exitoso"
}
```

---

### Request 3: Listar Productos
```
Method: GET
URL: {{base_url}}/api/producto/listar
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
```

**Expected Response (200):**
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
    },
    {
      "id_producto": 2,
      "nombre_comercial": "Paracetamol 500mg",
      "principio_activo": "Paracetamol",
      "nombre_categoria": "Analgésicos",
      "nombre_laboratorio": "Bayer",
      "nombre_presentacion": "Pastilla",
      "stock_actual_unidades": 200,
      "proximo_vencimiento": "2025-11-15"
    }
  ],
  "message": "Productos listados exitosamente"
}
```

---

### Request 4: Obtener Precios de Producto
```
Method: GET
URL: {{base_url}}/api/producto/1/precios
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
```

**Expected Response (200):**
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
      "nombre_unidad": "Blíster",
      "cantidad_equivalente": 10,
      "precio_venta": 22.00
    },
    {
      "id_producto_precio": 3,
      "nombre_unidad": "Caja",
      "cantidad_equivalente": 100,
      "precio_venta": 200.00
    }
  ],
  "message": "Precios obtenidos exitosamente"
}
```

---

## Casos de Error

### Error 400: Username y password requeridos
```
Method: POST
URL: {{base_url}}/api/auth/login
Body: {}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Username y password son requeridos"
}
```

---

### Error 401: Credenciales inválidas
```
Method: POST
URL: {{base_url}}/api/auth/login
Body: {
  "username": "usuario_inexistente",
  "password": "password"
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Usuario o contraseña incorrectos"
}
```

---

### Error 400: ID de producto inválido
```
Method: GET
URL: {{base_url}}/api/producto/xyz/precios
```

**Response (400):**
```json
{
  "success": false,
  "message": "El ID del producto es inválido"
}
```

---

### Error 404: Ruta no encontrada
```
Method: GET
URL: {{base_url}}/api/ruta_inexistente
```

**Response (404):**
```json
{
  "success": false,
  "message": "Ruta no encontrada"
}
```

---

## ⚡ Consejos de prueba

1. **Primero ejecuta el health check** para verificar que el servidor está corriendo
2. **Haz login** y guarda el token
3. **Usa el token** en los headers de las siguientes requests
4. **Verifica los códigos HTTP**: 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Server Error)
5. **Lee el mensaje de error** para entender qué falló

## 🔧 Troubleshooting

### "Error: connect ECONNREFUSED"
- ✅ Verifica que el servidor está ejecutándose: `npm run dev`

### "Database connection failed"
- ✅ Verifica las variables en `.env`
- ✅ Asegúrate que MySQL está ejecutándose
- ✅ Verifica que la BD `BoticaNovaSalud_Final` existe

### "Usuario o contraseña incorrectos"
- ✅ Verifica que el usuario existe en la BD
- ✅ Verifica que la contraseña está correcta y hasheada
