import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Board } from './src/models/models.js';

const MONGO_URI = process.env.MONGO_URI;

/**
 * Este script reasigna tableros a un usuario específico.
 * - Si SOURCE_OWNER_ID es un ID de MongoDB, mueve los tableros de ese dueño.
 * - Si SOURCE_OWNER_ID es 'HUERFANOS', asigna los tableros sin dueño.
 */

// --- CONFIGURACIÓN ---
// 1. ID del dueño original o la palabra 'HUERFANOS'.
const SOURCE_OWNER_ID = 'ID del owner de los tableros. ejemlo: 68f5e20fe5bf1cc507c31415';

// 2. Email del usuario que será el nuevo dueño.
const TARGET_USER_EMAIL = 'tu-email@ejemplo.com';
// -------------------

const runMigration = async () => {
    if (!MONGO_URI) {
        console.error('Error: La variable de entorno MONGO_URI no está definida.');
        process.exit(1);
    }
    if (!SOURCE_OWNER_ID || TARGET_USER_EMAIL === 'tu-email@ejemplo.com') {
        console.error('Error: Por favor, edita el script y define las variables SOURCE_OWNER_ID y TARGET_USER_EMAIL.');
        process.exit(1);
    }

    try {
        console.log('Conectando a la base de datos...');
        await mongoose.connect(MONGO_URI);
        console.log('Conexión exitosa.');

        // 1. Encontrar el usuario de destino.
        const targetUser = await User.findOne({ email: TARGET_USER_EMAIL });
        if (!targetUser) {
            throw new Error(`No se encontró ningún usuario con el email: ${TARGET_USER_EMAIL}`);
        }
        console.log(`Usuario de destino encontrado: ${targetUser.name} (ID: ${targetUser._id})`);

        let boardsToReassign;
        let updateFilter;

        // 2. Determinar qué tableros buscar según SOURCE_OWNER_ID
        if (SOURCE_OWNER_ID === 'HUERFANOS') {
            console.log('Buscando tableros huérfanos (sin dueño)...');
            updateFilter = { $or: [{ owner: { $exists: false } }, { owner: null }] };
            boardsToReassign = await Board.find(updateFilter);
        } else {
            console.log(`Buscando tableros del owner ID: ${SOURCE_OWNER_ID}...`);
            updateFilter = { owner: SOURCE_OWNER_ID };
            boardsToReassign = await Board.find(updateFilter);
        }

        if (boardsToReassign.length === 0) {
            console.log('No se encontraron tableros que coincidan con el criterio. No se necesita hacer nada.');
            return;
        }

        console.log(`Se encontraron ${boardsToReassign.length} tableros. Reasignando al usuario ${targetUser.email}...`);

        // 3. Actualizar el campo 'owner' de todos los tableros encontrados al ID del usuario de destino.
        const result = await Board.updateMany(updateFilter, { $set: { owner: targetUser._id } });

        console.log(`\n¡Migración completada! Se han reasignado ${result.modifiedCount} tableros.`);

    } catch (error) {
        console.error('Ocurrió un error durante la migración:', error);
    } finally {
        console.log('Desconectando de la base de datos...');
        await mongoose.disconnect();
    }
};

runMigration();
