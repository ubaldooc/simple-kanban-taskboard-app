/**
 * MANTENIMIENTO DE BASE DE DATOS - TASKBOARD
 * 
 * Este script permite:
 * 1. Limpiar tableros, columnas y tarjetas que no tienen un dueño válido (Huérfanos).
 * 2. Eliminar un usuario específico y todos sus datos por su email.
 * 
 * Uso: 
 *   node scripts/maintenance.js --clean-orphans
 *   node scripts/maintenance.js --delete-user email@ejemplo.com
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import { Board, Column, Card, User } from '../src/models/models.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mi_app_taskboard';

async function connect() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');
    }
}

async function cleanOrphans() {
    await connect();
    console.log('\n--- Buscando Tableros Huérfanos ---');

    const validUsers = await User.find({}, '_id').lean();
    const validUserIds = new Set(validUsers.map(u => u._id.toString()));

    const allBoards = await Board.find({}).lean();
    const orphanedBoards = allBoards.filter(board => !board.owner || !validUserIds.has(board.owner.toString()));
    const orphanedIds = orphanedBoards.map(b => b._id);

    if (orphanedIds.length > 0) {
        console.log(`🗑️  Eliminando ${orphanedIds.length} tableros huérfanos...`);
        await Card.deleteMany({ board: { $in: orphanedIds } });
        await Column.deleteMany({ board: { $in: orphanedIds } });
        await Board.deleteMany({ _id: { $in: orphanedIds } });
        console.log('✨ Limpieza de tableros completada.');
    } else {
        console.log('✅ No hay tableros huérfanos.');
    }

    // Limpieza profunda de tarjetas/columnas sin tablero
    const currentBoardIds = (await Board.find({}, '_id').lean()).map(b => b._id.toString());
    const colRes = await Column.deleteMany({ board: { $nin: currentBoardIds } });
    if (colRes.deletedCount > 0) console.log(`🗑️  Eliminadas ${colRes.deletedCount} columnas sin tablero.`);

    const cardRes = await Card.deleteMany({ board: { $nin: currentBoardIds } });
    if (cardRes.deletedCount > 0) console.log(`🗑️  Eliminadas ${cardRes.deletedCount} tarjetas sin tablero.`);
}

async function deleteUserByEmail(email) {
    if (!email) return console.error('❌ Debes proporcionar un email.');
    await connect();

    const user = await User.findOne({ email });
    if (!user) return console.log(`ℹ️  No existe el usuario con email: ${email}`);

    console.log(`\n--- Eliminando Usuario: ${email} ---`);
    const userId = user._id;

    const userBoards = await Board.find({ owner: userId }).lean();
    const boardIds = userBoards.map(b => b._id);

    console.log(`📦 Eliminando ${boardIds.length} tableros y todos sus contenidos...`);

    await Card.deleteMany({ board: { $in: boardIds } });
    await Column.deleteMany({ board: { $in: boardIds } });
    await Board.deleteMany({ owner: userId });
    await User.findByIdAndDelete(userId);

    console.log(`✅ Todo lo relacionado con ${email} ha sido borrado.`);
}

const args = process.argv.slice(2);
const command = args[0];
const value = args[1];

if (command === '--clean-orphans') {
    cleanOrphans().then(() => process.exit(0));
} else if (command === '--delete-user') {
    deleteUserByEmail(value).then(() => process.exit(0));
} else {
    console.log(`
Uso del script de mantenimiento:
  node scripts/maintenance.js --clean-orphans           (Limpia datos sin dueño)
  node scripts/maintenance.js --delete-user <email>     (Borra un usuario y sus datos)
    `);
    process.exit(0);
}
