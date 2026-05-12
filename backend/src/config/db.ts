import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nova_salud',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Conexión a la BD exitosa');
  } catch (error) {
    console.error('❌ Error conectando a la BD:', error);
    process.exit(1);
  }
}

export async function executeStoredProcedure(
  procedureName: string,
  params: any[] = []
): Promise<any> {
  try {
    const connection = await pool.getConnection();
    const placeholders = params.map(() => '?').join(',');
    const query = placeholders
      ? `CALL ${procedureName}(${placeholders})`
      : `CALL ${procedureName}()`;
    const [results] = await connection.execute(query, params);
    connection.release();
    return results;
  } catch (error) {
    console.error(`❌ Error ejecutando ${procedureName}:`, error);
    throw error;
  }
}

export default pool;