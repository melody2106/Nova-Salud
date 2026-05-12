import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';

// Rutas
import authRoutes from './routes/auth.routes.js';
import productoRoutes from './routes/producto.routes.js';
import empleadoRoutes from './routes/empleado.routes.js';
import ventaRoutes from './routes/venta.routes.js';
import compraRoutes from './routes/compra.routes.js';
import reporteRoutes from './routes/reporte.routes.js';
import catalogoRoutes from './routes/catalogo.routes.js';
import clienteRoutes from './routes/cliente.routes.js';


dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARES =====

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de peticiones (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`📍 ${new Date().toLocaleTimeString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ===== RUTAS =====

// Health check (público)
app.get('/health', (_req, res) => {
  res.json({ status: 'API funcionando ✅', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/producto', productoRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/clientes', clienteRoutes);

// ===== 404 =====
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// ===== INICIO =====
async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor en http://localhost:${PORT}`);
      console.log(`📡 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

start();