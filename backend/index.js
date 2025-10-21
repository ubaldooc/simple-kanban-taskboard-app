// index.js
import 'dotenv/config'; // Carga las variables de entorno desde .env
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken'; 
import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { Board, Column, Card, User, RefreshToken } from './src/models/models.js';
import { protect } from './src/middleware/authMiddleware.js';

// --- Configuración inicial ---
// Crea una instancia de la aplicación de Express
const app = express();
// Usa el puerto del .env o 5001 como valor por defecto. Asegúrate de que PORT esté en tu .env
const port = process.env.PORT || 5001;
// Usa la URI de MongoDB del .env. Asegúrate de que MONGO_URI esté en tu .env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mi_app_taskboard2';


// Middleware para habilitar CORS
// Es crucial configurar CORS para que acepte credenciales (cookies) desde tu frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // La URL de tu frontend
  credentials: true,
}));
app.use(cookieParser()); // Usa el middleware para parsear cookies
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


// GET /api/boards/list - Devuelve solo los IDs y títulos de los tableros.
app.get('/api/boards/list', protect, async (req, res) => { // <-- Ruta protegida
  try {
    // .sort({ order: 1 }) ordena los tableros por el campo 'order' de forma ascendente.
    // .select('title') pide a MongoDB que devuelva solo el campo 'title' (el _id se incluye por defecto).
    // ¡CAMBIO CLAVE! Filtramos por el 'owner' que viene desde el middleware 'protect'
    const boardList = await Board.find({ owner: req.user._id })
      .sort({ order: 1 })
      .select('title');
    res.status(200).json(boardList);
  } catch (error) {
    console.error('Error al obtener la lista de tableros:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener la lista de tableros.' });
  }
});




// --- User Preference Routes ---

// GET /api/user/preferences - Obtiene las preferencias del usuario (en este caso, el último tablero)
app.get('/api/user/preferences', protect, async (req, res) => { // <-- Ruta protegida
  try {
    // El usuario ya viene en req.user gracias al middleware
    res.status(200).json({ lastActiveBoardId: req.user.lastActiveBoard || null });
  } catch (error) {
    console.error('Error al obtener las preferencias del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// PUT /api/user/preferences - Actualiza las preferencias del usuario
app.put('/api/user/preferences', protect, async (req, res) => { // <-- Ruta protegida
  try {
    const { lastActiveBoardId } = req.body;
    await User.findByIdAndUpdate(
      req.user._id,
      { lastActiveBoard: lastActiveBoardId },
      { new: true }
    );
    res.status(200).json({ message: 'Preferencia actualizada.' });
  } catch (error) {
    console.error('Error al actualizar las preferencias del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});





          // BOARDS
          // BOARDS
          // BOARDS
          // BOARDS
          // BOARDS

// GET /api/boards - Devuelve todos los tableros con sus columnas y tarjetas.

// Esta ruta ya no es necesaria, ya que getBoardDetails y getBoardsList la reemplazan.
// La comentamos o eliminamos para evitar confusiones.
// app.get('/api/boards', ...);



// POST /api/boards - Crea un nuevo tablero
app.post('/api/boards', protect, async (req, res) => { // <-- Ruta protegida
  try {
    const { title, columns } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'El título es requerido.' });
    }

    // 1. Contar cuántos tableros existen para asignar el siguiente 'order'
    const boardCount = await Board.countDocuments({ owner: req.user._id });

    // 2. Crear el nuevo tablero con el título y el orden correctos
    const newBoard = new Board({ title, order: boardCount, owner: req.user._id }); // ¡Asignamos el dueño!


    // 2. Si se proporcionan columnas, crearlas y asociarlas.
    if (columns && Array.isArray(columns) && columns.length > 0) {
      const columnCreationPromises = columns.map(async (colData, colIndex) => {
        const newColumn = new Column({
          title: colData.title || 'Nueva Columna',
          color: colData.color || '#8b949e',
          board: newBoard._id,
          order: colIndex, // Asignar orden a la columna
        });

        // Si la columna tiene tarjetas, crearlas
        if (colData.cards && Array.isArray(colData.cards) && colData.cards.length > 0) {
          const cardCreationPromises = colData.cards.map((cardData, cardIndex) =>
            new Card({
              title: cardData.title,
              board: newBoard._id,
              column: newColumn._id,
              order: cardIndex, // Asignar orden a la tarjeta
            }).save()
          );
          const createdCards = await Promise.all(cardCreationPromises);
          newColumn.cards = createdCards.map(card => card._id);
        }

        await newColumn.save();
        return newColumn;
      });

      const createdColumns = await Promise.all(columnCreationPromises);
      newBoard.columns = createdColumns.map(col => col._id);
    }

    // 3. Guardar el tablero (con o sin columnas)
    await newBoard.save();

    // 4. Poblar el nuevo tablero con sus columnas para devolverlo completo
    const populatedBoard = await Board.findById(newBoard._id).populate({
      path: 'columns',
      populate: {
        path: 'cards'
      }
    });

    res.status(201).json(populatedBoard);
  } catch (error) {
    console.error('Error al crear el tablero:', error);
    res.status(500).json({ message: 'Error interno del servidor al crear el tablero.' });
  }
});



// PUT /api/boards/reorder - Actualiza el orden de los tableros
app.put('/api/boards/reorder', protect, async (req, res) => { // <-- Ruta protegida
  try {
    const { boardIds } = req.body;
    if (!boardIds || !Array.isArray(boardIds)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs de tableros.' });
    }

    // Actualiza el campo 'order' de cada tablero según su posición en el array
    const updatePromises = boardIds.map((id, index) =>
      Board.findOneAndUpdate({ _id: id, owner: req.user._id }, { order: index }) // Verificamos propiedad
    );
    await Promise.all(updatePromises);

    res.status(200).json({ message: 'Orden de los tableros actualizado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor al reordenar los tableros.' });
  }
});



// GET /api/boards/:id - Devuelve un tablero específico con sus columnas y tarjetas
app.get('/api/boards/:id', protect, async (req, res) => { // <-- Ruta protegida
  try {
    const boardId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: 'El ID del tablero no es válido.' });
    }

    // ¡CAMBIO CLAVE! Buscamos por ID y por el dueño.
    const board = await Board.findOne({ _id: boardId, owner: req.user._id })
      .populate({
        path: 'columns',
        options: { sort: { 'order': 1 } }, // <-- ¡Este es el cambio clave!
        populate: {
          path: 'cards',
          model: 'Card',
          options: { sort: { 'order': 1 } } // Ordenamos las tarjetas también
        }
      });

    if (!board) {
      return res.status(404).json({ message: 'Tablero no encontrado.' });
    }

    // Aplanamos las tarjetas para que estén en un solo array a nivel del tablero
    const boardObject = board.toObject();
    boardObject.cards = board.columns.reduce((allCards, column) => {
      // Asegurarse de que column.cards es un array antes de concatenar
      const columnCards = Array.isArray(column.cards) ? column.cards : [];
      return allCards.concat(columnCards);
    }, []);

    res.status(200).json(boardObject);
  } catch (error) {
    console.error('Error al obtener el tablero:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener el tablero.' });
  }
});



// PUT /api/boards/:id - Actualiza el título de un tablero
app.put('/api/boards/:id', protect, async (req, res) => { // <-- Ruta protegida
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'El título es requerido.' });
    }
    // ¡CAMBIO CLAVE! Actualizamos solo si el tablero pertenece al usuario.
    const updatedBoard = await Board.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id }, // El filtro debe ser un objeto
      { title },
      { new: true, runValidators: true } // Devuelve el documento actualizado y corre validaciones
    ).populate('columns'); // Poblar para mantener la consistencia con GET

    if (!updatedBoard) {
      return res.status(404).json({ message: 'Tablero no encontrado o no tienes permiso para editarlo.' });
    }
    res.status(200).json(updatedBoard);
  } catch (error) {
    console.error('Error al actualizar el tablero:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar el tablero.' });
  }
});




// DELETE /api/boards/:id - Elimina un tablero y su contenido asociado
app.delete('/api/boards/:id', protect, async (req, res) => { // <-- Ruta protegida
  try {
    const boardId = req.params.id;
    
    // Validación: Comprobar si el ID es un ObjectId válido de MongoDB
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: 'El ID del tablero proporcionado no es válido.' });
    }

    // 1. Intenta eliminar el tablero y comprueba si existía en un solo paso.
    // ¡CAMBIO CLAVE! Solo permite borrar si el tablero pertenece al usuario.
    const deletedBoard = await Board.findOneAndDelete({ _id: boardId, owner: req.user._id });
    
    // Si no se encontró ningún tablero para eliminar, devuelve 404.
    if (!deletedBoard) {
      return res.status(404).json({ message: 'Tablero no encontrado.' });
    }

    // 2. Si el tablero existía y fue eliminado, procede a limpiar su contenido asociado.
    await Card.deleteMany({ board: boardId });
    await Column.deleteMany({ board: boardId });
    
    // 3. Reordenar los tableros restantes para eliminar huecos en la secuencia 'order'.
    //    a. Obtener todos los tableros que quedan, ordenados por su 'order' actual.
    const remainingBoards = await Board.find({ owner: req.user._id }).sort({ order: 'asc' });

    //    b. Actualizar el 'order' de cada tablero a su nuevo índice.
    const reorderPromises = remainingBoards.map((board, index) =>
      Board.findByIdAndUpdate(board._id, { order: index })
    );
    await Promise.all(reorderPromises);

    
    res.status(200).json({ message: 'Tablero y todo su contenido eliminados exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar el tablero:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar el tablero.' });
  }
});



          // COLUMNS
          // COLUMNS
          // COLUMNS
          // COLUMNS
          // COLUMNS

// PUT /api/boards/:boardId/reorder-columns - Actualiza el orden de las columnas en un tablero
app.put('/api/boards/:boardId/reorder-columns', protect, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { columnIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: 'El ID del tablero no es válido.' });
    }
    if (!columnIds || !Array.isArray(columnIds)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs de columnas.' });
    }

    // Verificamos que el tablero pertenezca al usuario
    const board = await Board.findOne({ _id: boardId, owner: req.user._id });
    if (!board) {
      return res.status(404).json({ message: 'Tablero no encontrado o no tienes permiso.' });
    }

    // Actualiza el campo 'order' de cada columna según su posición en el array
    const updatePromises = columnIds.map((id, index) =>
      Column.findOneAndUpdate({ _id: id, board: boardId }, { order: index })
    );
    await Promise.all(updatePromises);

    res.status(200).json({ message: 'Orden de las columnas actualizado correctamente.' });
  } catch (error) {
    console.error('Error al reordenar las columnas:', error);
    res.status(500).json({ message: 'Error interno del servidor al reordenar las columnas.' });
  }
});



// POST /api/boards/:boardId/columns - Crea una nueva columna en un tablero específico
app.post('/api/boards/:boardId/columns', protect, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, color } = req.body;

    // 1. Validar que el ID del tablero sea válido
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: 'El ID del tablero no es válido.' });
    }

    // Verificamos que el tablero pertenezca al usuario
    const board = await Board.findOne({ _id: boardId, owner: req.user._id });
    if (!board) {
      return res.status(404).json({ message: 'Tablero no encontrado o no tienes permiso.' });
    }

    // 2. Validar que se haya proporcionado un título (ahora se permiten títulos vacíos)
    if (title === null || title === undefined) {
      return res.status(400).json({ message: 'El título de la columna es requerido.' });
    }

    // 3. Contar cuántas columnas existen en el tablero para asignar el siguiente 'order'
    const columnCount = await Column.countDocuments({ board: boardId });

    // 4. Crear la nueva columna (permitiendo que el título sea una cadena vacía)
    const newColumn = new Column({
      title: title.trim(),
      color: color, // Si no se proporciona, usará el default del schema
      order: columnCount,
      board: boardId,
    });
    await newColumn.save();

    // 4. Añadir la referencia de la nueva columna al array 'columns' del tablero
    await Board.findByIdAndUpdate(boardId, { $push: { columns: newColumn._id } });

    res.status(201).json(newColumn);
  } catch (error) {
    console.error('Error al crear la columna:', error);
    res.status(500).json({ message: 'Error interno del servidor al crear la columna.' });
  }
});



// PUT /api/columns/:id - Actualiza el título de una columna
app.put('/api/columns/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, color } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'El ID de la columna no es válido.' });
    }

    // Verificamos que la columna pertenezca a un tablero del usuario
    const column = await Column.findById(id);
    const board = await Board.findOne({ _id: column.board, owner: req.user._id });
    if (!board) {
      return res.status(403).json({ message: 'No tienes permiso para editar esta columna.' });
    }

    const updateData = {};
    if (title && title.trim() !== '') {
      updateData.title = title.trim();
    }
    if (color) {
      updateData.color = color;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });
    }

    const updatedColumn = await Column.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedColumn);
  } catch (error) {
    console.error('Error al actualizar la columna:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar la columna.' });
  }
});



// DELETE /api/columns/:id - Elimina una columna y su contenido asociado
app.delete('/api/columns/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'El ID de la columna no es válido.' });
    }

    // Verificamos que la columna pertenezca a un tablero del usuario
    const column = await Column.findById(id);
    if (!column) return res.status(404).json({ message: 'Columna no encontrada.' });
    const board = await Board.findOne({ _id: column.board, owner: req.user._id });
    if (!board) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta columna.' });
    }

    // 1. Encuentra y elimina la columna. 'deletedColumn' contendrá el documento eliminado.
    const deletedColumn = await Column.findByIdAndDelete(id); // Ya verificamos permisos, podemos borrar

    if (!deletedColumn) {
      return res.status(404).json({ message: 'Columna no encontrada.' });
    }

    // 2. Elimina todas las tarjetas que pertenecían a esa columna.
    await Card.deleteMany({ column: id });

    // 3. Elimina la referencia de la columna del array 'columns' en el tablero correspondiente.
    // Usamos $pull para quitar el ID de la columna del array.
    await Board.findByIdAndUpdate(deletedColumn.board, { $pull: { columns: id } });

    res.status(200).json({ message: 'Columna y sus tarjetas eliminadas exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar la columna:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar la columna.' });
  }
});


          // CARD
          // CARD
          // CARD
          // CARD
 
// PUT /api/boards/:boardId/reorder-cards - Actualiza el orden y/o la columna de las tarjetas
app.put('/api/boards/:boardId/reorder-cards', protect, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { cards } = req.body; // Esperamos un array de objetos { _id, order, column }

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: 'El ID del tablero no es válido.' });
    }
    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ message: 'Se requiere un array de tarjetas.' });
    }

    // Verificamos que el tablero pertenezca al usuario
    const board = await Board.findOne({ _id: boardId, owner: req.user._id });
    if (!board) {
      return res.status(404).json({ message: 'Tablero no encontrado o no tienes permiso.' });
    }

    // Preparamos las operaciones para bulkWrite.
    // Esto es mucho más eficiente que hacer múltiples llamadas a la base de datos.
    const bulkOps = cards.map(card => ({
      updateOne: {
        filter: { _id: card._id, board: boardId }, // Añadimos filtro de tablero por seguridad
        update: {
          $set: {
            order: card.order,
            column: card.column
          }
        }
      }
    }));

    // Si no hay operaciones, no hacemos nada.
    if (bulkOps.length === 0) {
      return res.status(200).json({ message: 'No hay tarjetas para actualizar.' });
    }

    // Ejecutamos todas las actualizaciones en una sola llamada a la base de datos.
    await Card.bulkWrite(bulkOps);

    // Nota: Esta implementación no actualiza el array `cards` dentro de cada `Column`.
    // Esto está bien si el frontend no depende de ese array para el orden,
    // y en su lugar confía en el `populate` con ordenamiento que ya tienes.

    res.status(200).json({ message: 'Orden de las tarjetas actualizado correctamente.' });
  } catch (error) {
    console.error('Error al reordenar las tarjetas:', error);
    res.status(500).json({ message: 'Error interno del servidor al reordenar las tarjetas.' });
  }
});



// POST /api/columns/:columnId/cards - Crea una nueva tarjeta en una columna
app.post('/api/columns/:columnId/cards', protect, async (req, res) => {
  try {
    const { columnId } = req.params;
    const { title } = req.body;

    // 1. Validar que el ID de la columna sea válido
    if (!mongoose.Types.ObjectId.isValid(columnId)) {
      return res.status(400).json({ message: 'El ID de la columna no es válido.' });
    }

    // 2. Validar que se haya proporcionado un título
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'El título de la tarjeta es requerido.' });
    }

    // 3. Encontrar la columna para obtener el ID del tablero
    const parentColumn = await Column.findById(columnId);
    if (!parentColumn) {
      return res.status(404).json({ message: 'La columna especificada no existe.' });
    }

    // Verificamos que la columna padre pertenezca a un tablero del usuario
    const board = await Board.findOne({ _id: parentColumn.board, owner: req.user._id });
    if (!board) {
      return res.status(403).json({ message: 'No tienes permiso para añadir tarjetas a esta columna.' });
    }

    // 4. Contar cuántas tarjetas existen en la columna para asignar el siguiente 'order'
    const cardCount = await Card.countDocuments({ column: columnId });

    // 5. Crear la nueva tarjeta
    const newCard = new Card({
      title: title.trim(),
      column: columnId,
      board: parentColumn.board, // Asignamos el ID del tablero desde la columna padre
      order: cardCount,
    });
    await newCard.save();

    // 5. Añadir la referencia de la nueva tarjeta al array 'cards' de la columna
    await Column.findByIdAndUpdate(columnId, { $push: { cards: newCard._id } });

    res.status(201).json(newCard);
  } catch (error) {
    console.error('Error al crear la tarjeta:', error);
    res.status(500).json({ message: 'Error interno del servidor al crear la tarjeta.' });
  }
});



// PUT /api/cards/:id - Actualiza una tarjeta (título, columna, orden)
app.put('/api/cards/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, column, order } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'El ID de la tarjeta no es válido.' });
    }

    // Verificamos que la tarjeta pertenezca a un tablero del usuario
    const card = await Card.findById(id);
    const board = await Board.findOne({ _id: card.board, owner: req.user._id });
    if (!board) {
      return res.status(403).json({ message: 'No tienes permiso para editar esta tarjeta.' });
    }

    const updateData = {};
    if (title && title.trim() !== '') {
      updateData.title = title.trim();
    }
    // Aquí podrías añadir lógica para mover la tarjeta a otra columna
    // y para reordenar, pero por ahora nos centramos en el título.

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });
    }

    const updatedCard = await Card.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ message: 'Tarjeta no encontrada.' });
    }

    res.status(200).json(updatedCard);
  } catch (error) {
    console.error('Error al actualizar la tarjeta:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar la tarjeta.' });
  }
});



// DELETE /api/cards/:id - Elimina una tarjeta
app.delete('/api/cards/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'El ID de la tarjeta no es válido.' });
    }

    // Verificamos que la tarjeta pertenezca a un tablero del usuario
    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: 'Tarjeta no encontrada.' });
    const board = await Board.findOne({ _id: card.board, owner: req.user._id });
    if (!board) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta tarjeta.' });
    }

    // 1. Encuentra y elimina la tarjeta. 'deletedCard' contendrá el documento eliminado.
    const deletedCard = await Card.findByIdAndDelete(id); // Ya verificamos permisos

    if (!deletedCard) {
      return res.status(404).json({ message: 'Tarjeta no encontrada.' });
    }

    // 2. Si la tarjeta fue eliminada, quita su referencia de la columna correspondiente.
    if (deletedCard.column) {
      await Column.findByIdAndUpdate(deletedCard.column, {
        $pull: { cards: deletedCard._id },
      });
    }

    res.status(200).json({ message: 'Tarjeta eliminada exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar la tarjeta:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar la tarjeta.' });
  }
});






// --- Google OAuth2 Authentication Route PARA INICIAR SESION CON GOOGLE ---
// Configura el cliente de Google OAuth2 para el flujo de código de autorización
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage' // Requerido por Google para este flujo seguro
);

// --- Helper para generar tokens ---
const generateTokensAndSetCookie = async (res, userId) => {
  // 1. Crear Access Token (corta duración)
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });

  // 2. Crear Refresh Token (larga duración) y guardarlo en la BD
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  await RefreshToken.create({ token: refreshToken, user: userId, expires });

  // 3. Enviar el Refresh Token en una cookie HttpOnly
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', expires });

  return accessToken;
};

// POST /api/auth/google - Maneja el inicio de sesión/registro con el código de Google
app.post('/api/auth/google', async (req, res) => {
  try {
    const { code } = req.body;
    console.log('Código recibido:', code); // <-- Agrega esto para depurar
    if (!code) {
      return res.status(400).json({ message: 'El código de autorización de Google es requerido.' });
    }

    // 1. Intercambiar el código de autorización por tokens de acceso e ID
    const { tokens } = await oAuth2Client.getToken(code);
    const { id_token } = tokens;

    // 2. Verificar el ID Token para obtener la información del usuario de forma segura
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const profile = ticket.getPayload();
    const { sub: googleId, email, name, picture } = profile;

    // 3. Buscar si el usuario ya existe en la base de datos (por email o googleId)
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Si no existe, crea un nuevo usuario con los datos de Google
      user = new User({
        name: name || 'Usuario de Google',
        email,
        googleId,
        picture,
      });
    } else if (!user.googleId) {
      // Si el usuario ya existía (p.ej. se registró con email/pass) pero ahora usa Google,
      // vinculamos la cuenta actualizando su googleId y foto.
      user.googleId = googleId;
      user.picture = picture;
    }
    // Guardar el usuario (sea nuevo o actualizado)
    await user.save();

    // 4. Generar tokens y configurar la cookie de refresh token
    const accessToken = await generateTokensAndSetCookie(res, user._id);

    // 5. Enviar el accessToken y los datos del usuario en la respuesta
    res.status(200).json({ 
      message: 'Inicio de sesión exitoso con Google.', 
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, picture: user.picture } 
    });

  } catch (error) {
    console.error('Error durante la autenticación con Google:', error);
    res.status(401).json({ message: 'Autenticación de Google fallida.' });
  }
});

// POST /api/auth/register - Registra un nuevo usuario con email y contraseña
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validación de datos de entrada
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // 2. Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'El correo electrónico ya está en uso.' }); // 409 Conflict
    }

    // 3. Hashear la contraseña (¡NUNCA guardes contraseñas en texto plano!)
    const salt = await bcrypt.genSalt(10); // Genera un "salt" para el hash
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Crear el nuevo usuario
    const newUser = new User({
      name,
      email,
      password: hashedPassword, // Guardamos la contraseña hasheada
    });
    await newUser.save();

    // 5. Generar tokens y configurar la cookie de refresh token
    const accessToken = await generateTokensAndSetCookie(res, newUser._id);

    // 6. Enviar la respuesta con el accessToken y los datos del usuario
    res.status(201).json({ // 201 Created
      message: 'Usuario registrado exitosamente.',
      accessToken,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, picture: newUser.picture }
    });

  } catch (error) {
    console.error('Error durante el registro:', error);
    res.status(500).json({ message: 'Error interno del servidor durante el registro.' });
  }
});

// POST /api/auth/login - Inicia sesión con email y contraseña
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validación de datos de entrada
    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos.' });
    }

    // 2. Buscar al usuario por su correo electrónico
    const user = await User.findOne({ email });
    if (!user) {
      // Usamos un mensaje genérico para no revelar si el email existe o no
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    // 3. Verificar que el usuario tenga una contraseña (pudo haberse registrado con Google)
    if (!user.password) {
      return res.status(401).json({ message: 'Esta cuenta fue creada con Google. Por favor, inicia sesión con Google.' });
    }

    // 4. Comparar la contraseña proporcionada con la contraseña hasheada en la BD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    // 5. Generar tokens y configurar la cookie de refresh token
    const accessToken = await generateTokensAndSetCookie(res, user._id);

    // 6. Enviar la respuesta con el accessToken y los datos del usuario
    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, picture: user.picture }
    });

  } catch (error) {
    console.error('Error durante el inicio de sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor durante el inicio de sesión.' });
  }
});

// POST /api/auth/refresh - Emite un nuevo accessToken usando un refreshToken
app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No se proporcionó refresh token.' });
  }

  try {
    // Buscar el refresh token en la base de datos
    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    // Verificar si el token existe y no ha expirado
    if (!storedToken || storedToken.expires < new Date()) {
      await RefreshToken.deleteOne({ token: refreshToken }); // Limpiar token inválido
      res.clearCookie('refreshToken');
      return res.status(403).json({ message: 'Refresh token inválido o expirado.' });
    }

    // Generar un nuevo access token
    const accessToken = jwt.sign({ userId: storedToken.user }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Error al refrescar el token:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// POST /api/auth/logout - Cierra la sesión del usuario
app.post('/api/auth/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      // Elimina el refresh token de la base de datos para invalidarlo
      await RefreshToken.deleteOne({ token: refreshToken });
    }
  } catch (error) {
    console.error("Error al invalidar el refresh token:", error);
  }
  // Limpia la cookie del navegador
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Cierre de sesión exitoso.' });
});
