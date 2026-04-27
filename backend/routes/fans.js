const express = require('express');
const { getDB } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const COLLECTION = 'fans-shirt';
const VALID_MODELOS = ['jugador', 'portero'];
const VALID_TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

// ── POST /api/fans ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { nombre, telefono, genero, nombrePolera, talla, numeroPolera, modelo } = req.body;

  if (!nombre || !telefono || !nombrePolera || !talla || !numeroPolera || !modelo) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  if (!VALID_MODELOS.includes(modelo)) {
    return res.status(400).json({ error: 'Modelo inválido' });
  }

  if (!VALID_TALLAS.includes(talla)) {
    return res.status(400).json({ error: 'Talla inválida' });
  }

  const numInt = parseInt(numeroPolera, 10);
  if (isNaN(numInt) || numInt < 1 || numInt > 999) {
    return res.status(400).json({ error: 'Número de polera inválido (1–999)' });
  }

  try {
    const db = getDB();
    const result = await db.collection(COLLECTION).insertOne({
      nombre: String(nombre).trim(),
      telefono: String(telefono).trim(),
      ...(genero && { genero: String(genero).trim() }),
      nombrePolera: String(nombrePolera).trim().toUpperCase(),
      talla,
      numeroPolera: numInt,
      modelo,
      creadoEn: new Date(),
    });

    return res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    console.error('post fan error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /api/fans (protected) ─────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const docs = await db
      .collection(COLLECTION)
      .find({})
      .sort({ creadoEn: 1 })
      .toArray();
    return res.json(docs);
  } catch (err) {
    console.error('get fans error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
