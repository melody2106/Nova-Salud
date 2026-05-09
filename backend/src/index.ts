import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import productoRoutes from './routes/producto.routes.js';
import empleadoRoutes from './routes/empleado.routes.js';
import ventaRoutes from './routes/venta.routes.js';
import compraRoutes from './routes/compra.routes.js';
import reporteRoutes from './routes/reporte.routes.js';

// Cargar variables de entorno
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ====
// = MIDDLEWARES =====

// CORS
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://tusitio.com' : '*',
    credentials: true,
  })
);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logs
app.use((req, res, next) => {
  console.log(`📍 ${new Date().toLocaleTimeString()} - ${req.method} ${req.path}`);
  next();
});

// ===== RUTAS =====

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API funcionando ✅' });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de productos
app.use('/api/producto', productoRoutes);

// Rutas de empleados
app.use('/api/empleados', empleadoRoutes);

// Rutas de ventas
app.use('/api/ventas', ventaRoutes);

// Rutas de compras
app.use('/api/compras', compraRoutes);

// Rutas de reportes
app.use('/api/reportes', reporteRoutes);

// ===== MANEJO DE RUTAS NO ENCONTRADAS =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// ===== INICIO DEL SERVIDOR =====
async function start() {
  try {
    // Verificar conexión a BD
    await testConnection();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`📡 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

start();
