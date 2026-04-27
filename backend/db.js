const { MongoClient } = require('mongodb');

let db;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');

  const client = new MongoClient(uri);
  await client.connect();

  db = client.db(process.env.DB_NAME || 'einlich');
  console.log(`Connected to MongoDB — database: ${db.databaseName}`);

  // Ensure indexes
  await db.collection('player-shirt').createIndex({ numeroPolera: 1 }, { unique: true, sparse: true });
  await db.collection('player-shirt').createIndex({ nombreJugador: 1, modelo: 1 }, { unique: true });

  return db;
}

function getDB() {
  if (!db) throw new Error('Database not initialised — call connectDB first');
  return db;
}

module.exports = { connectDB, getDB };
