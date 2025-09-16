// index.js
import 'dotenv/config'; // Carga las variables de entorno desde .env
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Board, Column, Card } from './models/models.js';

// --- Configuración inicial ---
// Crea una instancia de la aplicación de Express
const app = express();
// Usa el puerto del .env o 5001 como valor por defecto
const port = process.env.PORT || 5001;
// Usa la URI de MongoDB del .env o una local como valor por defecto
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mi_app_taskboard';


// Middleware para habilitar CORS
app.use(cors());

// Middleware para analizar el cuerpo de las peticiones en formato JSON
app.use(express.json());

// Define una ruta simple para probar que el servidor funciona
app.get('/', (req, res) => {
  res.send('¡Hola, mundo desde el backend!');
});

// --- API Routes ---

// GET /api/boards - Devuelve todos los tableros (aún por implementar con Mongoose)
app.get('/api/boards', async (req, res) => {
  // TODO: Reemplazar con la lógica para buscar los tableros en MongoDB
  res.json([]);
});

// --- Conexión a la base de datos y arranque del servidor ---
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB exitosamente.');
    app.listen(port, () => {
      console.log(`Servidor escuchando en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error);
  }
};

startServer();