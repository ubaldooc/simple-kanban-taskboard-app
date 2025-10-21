import mongoose from 'mongoose';

const { Schema } = mongoose;

// --- Card Schema ---
// Las tarjetas son los elementos individuales dentro de una columna.
const CardSchema = new Schema({
  title: { type: String, required: true, default: 'Nueva Tarjeta' },
  // Referencia a la columna a la que pertenece.
  // Campo para mantener el orden de las tarjetas dentro de una columna.
  order: { type: Number, default: 0 },
  column: { type: Schema.Types.ObjectId, ref: 'Column', required: true },
  // Referencia al tablero para facilitar las consultas.
  board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
}, { timestamps: true });

// --- Column Schema ---
// Las columnas organizan las tarjetas.
const ColumnSchema = new Schema({
  title: { type: String, default: 'Nueva Columna' },
  color: { type: String, default: '#8b949e' },
  // Campo para mantener el orden de las columnas dentro de un tablero.
  order: { type: Number, default: 0 },
  // Referencia al tablero al que pertenece.
  board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
  // Array de referencias a las tarjetas que contiene, para mantener el orden.
  cards: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
}, { timestamps: true });

// --- Board Schema ---
// El tablero es el contenedor principal.
const BoardSchema = new Schema({
  title: { type: String, required: true, default: 'Nuevo Tablero' },
  // Campo para mantener el orden de los tableros.
  order: { type: Number, default: 0 },
  // Array de referencias a los documentos de las columnas para mantener el orden.
  columns: [{ type: Schema.Types.ObjectId, ref: 'Column' }],
  // --- ¡CAMBIO CLAVE! ---
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// --- User Schema ---
// Representa a un usuario de la aplicación.
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // Asegura que el email sea único, pero permite nulos
  googleId: { type: String, unique: true, sparse: true }, // ID único de Google, permite nulos
  picture: { type: String }, // URL de la imagen de perfil de Google
  password: { type: String }, // Campo para la contraseña hasheada
  // Referencia al último tablero que el usuario tuvo activo.
  lastActiveBoard: { type: Schema.Types.ObjectId, ref: 'Board', default: null },
}, { timestamps: true });

// --- Refresh Token Schema ---
// Almacena los refresh tokens de forma segura en la base de datos.
const RefreshTokenSchema = new Schema({
  token: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expires: { type: Date, required: true },
});

// --- Models ---
// Exportamos los modelos para poder usarlos en otras partes de la aplicación.
export const Card = mongoose.model('Card', CardSchema);
export const Column = mongoose.model('Column', ColumnSchema);
export const Board = mongoose.model('Board', BoardSchema);
export const User = mongoose.model('User', UserSchema);
export const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);



// ESTO ES LO MISMO DE ARRIBA PERO CON EL MODO ESTRICTO DESACTIVADO

// import mongoose from 'mongoose';

// const { Schema } = mongoose;

// // --- Card Schema ---
// // Las tarjetas son los elementos individuales dentro de una columna.
// const CardSchema = new Schema({
//   title: { type: String, required: true, default: 'Nueva Tarjeta' },
//   // Referencia a la columna a la que pertenece.
//   column: { type: Schema.Types.ObjectId, ref: 'Column', required: true },
//   // Referencia al tablero para facilitar las consultas.
//   board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
// }, { timestamps: true, strict: false });

// // --- Column Schema ---
// // Las columnas organizan las tarjetas.
// const ColumnSchema = new Schema({
//   title: { type: String, required: true, default: 'Nueva Columna' },
//   color: { type: String, default: '#8b949e' },
//   // Referencia al tablero al que pertenece.
//   board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
//   // Array de referencias a las tarjetas que contiene, para mantener el orden.
//   cards: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
// }, { timestamps: true, strict: false });

// // --- Board Schema ---
// // El tablero es el contenedor principal.
// const BoardSchema = new Schema({
//   title: { type: String, required: true, default: 'Nuevo Tablero' },
//   // Array de referencias a los documentos de las columnas para mantener el orden.
//   columns: [{ type: Schema.Types.ObjectId, ref: 'Column' }],
// }, { timestamps: true, strict: false });


// // --- Models ---
// // Exportamos los modelos para poder usarlos en otras partes de la aplicación.
// export const Card = mongoose.model('Card', CardSchema);
// export const Column = mongoose.model('Column', ColumnSchema);
// export const Board = mongoose.model('Board', BoardSchema);
