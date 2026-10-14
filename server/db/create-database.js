import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function crearBaseDeDatos() {
  // Conectar a la base de datos por defecto 'postgres'
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: 'postgres',
    port: Number(process.env.PGPORT) || 5432,
  });

  try {
    await client.connect();
    console.log('🔌 Conectado a PostgreSQL en la base de datos administrativa "postgres".');

    const dbName = process.env.PGDATABASE || 'obento_db';
    const checkRes = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);

    if (checkRes.rows.length === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✨ ¡Base de datos "${dbName}" creada con éxito!`);
    } else {
      console.log(`ℹ️ La base de datos "${dbName}" ya existía.`);
    }
  } catch (err) {
    console.error('❌ Error al intentar crear la base de datos automáticamente:', err.message);
  } finally {
    await client.end();
  }
}

crearBaseDeDatos();
