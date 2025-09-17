// index.js
import 'dotenv/config'; // Carga las variables de entorno desde .env
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Board, Column, Card } from './src/models/models.js';

// --- Configuración inicial ---
// Crea una instancia de la aplicación de Express
const app = express();
// Usa el puerto del .env o 5001 como valor por defecto
const port =  5001;
// Usa la URI de MongoDB del .env o una local como valor por defecto
const MONGO_URI = 'mongodb://localhost:27017/mi_app_taskboard';


// Middleware para habilitar CORS
app.use(cors());

// Middleware para analizar el cuerpo de las peticiones en formato JSON
app.use(express.json());



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


// Define una ruta simple para probar que el servidor funciona
app.get('/', (req, res) => {
  res.send('¡Hola, mundo desde el backend!');
});

// --- API Routes ---

// // GET /api/boards - Devuelve todos los tableros con sus columnas y tarjetas.
// app.get('/api/boards', async (req, res) => {
//   try {
//     const boards = await Board.find({})
//       .populate('columns')
//       .populate('cards');
    
//     // Si no hay tableros, se devolverá un array vacío, lo cual es correcto.
//     res.status(200).json(boards);
//   } catch (error) {
//     console.error('Error al obtener los tableros:', error);
//     res.status(500).json({ message: 'Error interno del servidor al obtener los tableros.' });
//   }
// });




// POST /api/boards - Crea un nuevo tablero
app.post('/api/boards', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'El título es requerido.' });
    }
    // 1. Crear el nuevo tablero
    const newBoard = new Board({ title });
    // 2. Crear una columna por defecto para el nuevo tablero
    const defaultColumn = new Column({
      title: 'To Do',
      color: '#42A5F5',
      board: newBoard._id
    });
    await defaultColumn.save();
    // 3. Asignar la columna al tablero y guardar el tablero
    newBoard.columns.push(defaultColumn._id);
    await newBoard.save();
    // 4. Poblar el nuevo tablero con su columna para devolverlo completo
    const populatedBoard = await Board.findById(newBoard._id).populate('columns');
    res.status(201).json(populatedBoard);
  } catch (error) {
    console.error('Error al crear el tablero:', error);
    res.status(500).json({ message: 'Error interno del servidor al crear el tablero.' });
  }
});


// PUT /api/boards/:id - Actualiza el título de un tablero
app.put('/api/boards/:id', async (req, res) => {
  try {
    const { title } = req.body;
    const updatedBoard = await Board.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true, runValidators: true } // Devuelve el documento actualizado y corre validaciones
    ).populate('columns'); // Poblar para mantener la consistencia con GET
    res.status(200).json(updatedBoard);
  } catch (error) {
    console.error('Error al actualizar el tablero:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar el tablero.' });
  }
});





