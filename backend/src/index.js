// index.js
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises'; // Usamos fs/promises para async/await
import path from 'path';
import { fileURLToPath } from 'url';

// Helper para obtener la ruta del directorio actual con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../db.json');

// Crea una instancia de la aplicación de Express
const app = express();
const port = 3001; // Cambiamos a 3001 para evitar conflictos con el frontend

// Middleware para habilitar CORS
app.use(cors());

// Middleware para analizar el cuerpo de las peticiones en formato JSON
app.use(express.json());

// Define una ruta simple para probar que el servidor funciona
app.get('/', (req, res) => {
  res.send('¡Hola, mundo desde el backend!');
});

// --- API Routes ---

// GET /api/boards - Devuelve todos los tableros desde db.json
app.get('/api/boards', async (req, res) => {
  const data = await fs.readFile(dbPath, 'utf-8');
  res.json(JSON.parse(data));
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});