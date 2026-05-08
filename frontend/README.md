# 🏥 Nova Salud - Frontend (React + TypeScript + Vite)

Frontend moderno para el sistema de gestión de botica "Nova Salud" construido con React 18, TypeScript, Tailwind CSS y Vite.

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── Layout.tsx          # Layout principal con sidebar
│   │   │   ├── ProtectedRoute.tsx  # Componente para rutas protegidas
│   │   │   └── figma/              # Componentes de Figma
│   │   ├── pages/
│   │   │   ├── Login.tsx           # Página de login
│   │   │   ├── Pos.tsx             # Punto de venta
│   │   │   ├── Inventory.tsx       # Gestión de inventario
│   │   │   ├── HR.tsx              # Recursos humanos
│   │   │   └── Config.tsx          # Configuración
│   │   ├── App.tsx                 # Componente raíz
│   │   └── routes.tsx              # Configuración de rutas
│   ├── contexts/
│   │   └── AuthContext.tsx         # Context global de autenticación
│   ├── services/
│   │   ├── api.ts                  # Cliente Axios centralizado
│   │   └── authService.ts          # Servicio de autenticación
│   ├── styles/
│   │   ├── index.css               # Estilos Tailwind
│   │   ├── fonts.css               # Tipografías
│   │   └── theme.css               # Variables de tema
│   └── main.jsx                    # Punto de entrada
├── index.html                      # HTML principal
├── vite.config.ts                  # Configuración Vite
├── tailwind.config.js              # Configuración Tailwind
├── postcss.config.js               # Configuración PostCSS
├── package.json                    # Dependencias y scripts
├── tsconfig.json                   # Configuración TypeScript
└── .env                            # Variables de entorno
```

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
cd frontend
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env` basado en `.env.example`:
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 📦 Dependencias Principales

- **React 18** - Librería UI
- **TypeScript** - Tipado estático
- **Vite** - Bundler ultra rápido
- **React Router v6** - Routing
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos
- **date-fns** - Utilidades de fecha

## 🔐 Autenticación

El proyecto implementa autenticación con JWT usando:

1. **AuthContext** - Gestión global del estado de autenticación
2. **authService** - Comunicación con `/api/auth/login`
3. **ProtectedRoute** - Protección de rutas privadas
4. **localStorage** - Almacenamiento del token JWT

### Flujo de Login

```
Usuario escribe credenciales
         ↓
Login.tsx llama a useAuth().login()
         ↓
authService.login() hace POST a /api/auth/login
         ↓
Backend devuelve token + usuario
         ↓
Se guardan en localStorage
         ↓
Redirige a /pos
```

## 🛡️ Rutas Protegidas

Las rutas `/pos`, `/inventory`, `/hr`, `/config` están protegidas por `ProtectedRoute`:
- Si el usuario NO está autenticado → Redirige a `/login`
- Si el token expiró → Limpia localStorage y redirige a `/login`

## 🎨 Diseño y Estilos

- **Color primario**: Teal (`#14b8a6`)
- **Paleta**: Slate + Teal
- **Framework**: Tailwind CSS (sin librerías UI pesadas)
- **Responsive**: Mobile-first design
- **Animaciones**: Suaves transiciones con Tailwind

## 📱 Componentes Principales

### Layout
Panel lateral con navegación y datos del usuario autenticado

### Login
- Autenticación con credenciales reales
- Validación de errores desde el backend
- Indicadores de carga
- Credenciales de prueba visibles (para desarrollo)

### Pos (Punto de Venta)
- Búsqueda de clientes
- Carrito de compras
- Cálculo de totales
- Métodos de pago

### Inventory
- Gestión de stock
- Búsqueda de productos
- Alertas de bajo stock

### HR & Config
- Plantillas para funcionalidades futuras

## 🔗 Integración con Backend

El frontend comunica con el backend Node.js/Express mediante Axios:

```typescript
// Cliente configurado automáticamente
apiClient.getClient().post('/auth/login', credentials)

// Token JWT se agrega automáticamente a cada request
Authorization: Bearer <token>

// Errores 401 redirigen a login
```

## 📝 Scripts Disponibles

| Comando | Descripción |
|---------|------------|
| `npm run dev` | Ejecuta dev server (Vite) |
| `npm run build` | Compila a producción |
| `npm run preview` | Pre-visualiza build de producción |

## 🐛 Troubleshooting

### Error: "Cannot find module 'axios'"
```bash
npm install
```

### Backend no responde
- Verifica que el backend esté corriendo: `npm run dev` en carpeta `backend/`
- Verifica VITE_API_URL en `.env`

### Token expirado
- El usuario será redirigido a login automáticamente
- Se limpian localStorage y token

## 🎯 Próximas Fases

- [ ] Implementar búsqueda de productos en tiempo real
- [ ] Agregar módulo de reportes
- [ ] Integración con API de ventas y compras
- [ ] Validaciones complejas de formularios
- [ ] Mejoras de UX/accessibility
- [ ] Tests unitarios con Vitest

## 📚 Documentación

- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)
- [React Router](https://reactrouter.com)

---

**Desarrollado con ❤️ para Nova Salud**
