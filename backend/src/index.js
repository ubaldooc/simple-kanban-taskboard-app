// index.js
import express from 'express';
import cors from 'cors';

// Crea una instancia de la aplicación de Express
const app = express();
const port = 3000; // Puedes usar el puerto que desees

// Middleware para habilitar CORS
app.use(cors());

// Middleware para analizar el cuerpo de las peticiones en formato JSON
app.use(express.json());

// Define una ruta simple para probar que el servidor funciona
app.get('/', (req, res) => {
  res.send('¡Hola, mundo desde el backend!');
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});