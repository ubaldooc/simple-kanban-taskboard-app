import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/models.js';

const MONGO_URI = process.env.MONGO_URI;

/**
 * Este script actualiza todos los usuarios en la base de datos
 * que tienen el campo 'wallpaper' con el valor "default"
 * y lo cambia a la nueva URL '/wallpapers/wallpaper-0.jpg'.
 */

const wallpaperPorDefecto = 'https://res.cloudinary.com/drljxouhe/image/upload/v1762161290/wallpaper-0_y7ewia.webp';

const runMigration = async () => {
  if (!MONGO_URI) {
    console.error('Error: La variable de entorno MONGO_URI no está definida.');
    process.exit(1);
  }

  try {
    console.log('Conectando a la base de datos...');
    await mongoose.connect(MONGO_URI);
    console.log('Conexión exitosa. Ejecutando migración...');

    const oldWallpaperValue = 'default';
    const newWallpaperValue = wallpaperPorDefecto;

    // Usamos updateMany para actualizar todos los documentos que coincidan con el filtro.
    const result = await User.updateMany(
      { wallpaper: oldWallpaperValue }, // Filtro: encuentra todos los usuarios con wallpaper="default"
      { $set: { wallpaper: newWallpaperValue } } // Acción: actualiza el campo wallpaper a la nueva URL
    );

    console.log('-----------------------------------------');
    console.log('Migración completada.');
    console.log(`- Documentos encontrados que coincidían: ${result.matchedCount}`);
    console.log(`- Documentos actualizados: ${result.modifiedCount}`);
    console.log('-----------------------------------------');

  } catch (error) {
    console.error('Ocurrió un error durante la migración:', error);
  } finally {
    // Es crucial desconectarse de la base de datos para que el script termine.
    console.log('Desconectando de la base de datos...');
    await mongoose.disconnect();
  }
};

// Ejecutar la función principal del script.
runMigration();