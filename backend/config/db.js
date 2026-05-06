const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db'); // Aquí importas el archivo que acabas de crear

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Para que el servidor entienda JSON

// RUTA DE PRUEBA: Para ver si funciona
app.get('/productos', (req, res) => {
  const query = 'SELECT * FROM Productos';
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});