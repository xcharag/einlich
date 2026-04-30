const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const COLLECTION = 'player-shirt';
const VALID_MODELOS = ['jugador', 'portero'];
const VALID_TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

// ── GET /api/players/check?nombreJugador=X&modelo=Y ──────────────────────────
// Returns existing doc (or null) so the frontend can switch to update mode.
router.get('/check', async (req, res) => {
  const { nombreJugador, modelo } = req.query;

  if (!nombreJugador || !modelo) {
    return res.status(400).json({ error: 'nombreJugador y modelo son requeridos' });
  }

  if (!VALID_MODELOS.includes(modelo)) {
    return res.status(400).json({ error: 'Modelo inválido' });
  }

  try {
    const db = getDB();
    const doc = await db.collection(COLLECTION).findOne({ nombreJugador, modelo });
    return res.json(doc || null);
  } catch (err) {
    console.error('check error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /api/players/submitted ───────────────────────────────────────────────
// Public endpoint: returns which players have submitted and which models.
router.get('/submitted', async (req, res) => {
  try {
    const db = getDB();
    const docs = await db
      .collection(COLLECTION)
      .find({}, { projection: { nombreJugador: 1, modelo: 1 } })
      .toArray();

    // Group by player name
    const map = {};
    for (const doc of docs) {
      if (!map[doc.nombreJugador]) map[doc.nombreJugador] = [];
      map[doc.nombreJugador].push(doc.modelo);
    }

    const result = Object.entries(map).map(([nombreJugador, modelos]) => ({
      nombreJugador,
      modelos,
    }));

    return res.json(result);
  } catch (err) {
    console.error('submitted error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /api/players (protected) ─────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const docs = await db
      .collection(COLLECTION)
      .find({})
      .sort({ nombreJugador: 1, modelo: 1 })
      .toArray();
    return res.json(docs);
  } catch (err) {
    console.error('get players error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /api/players ─────────────────────────────────────────────────────────
// Players submit name+shirt details including their number (once, cannot edit later).
router.post('/', async (req, res) => {
  const { nombreJugador, nombrePolera, talla, numeroPolera, modelo } = req.body;

  if (!nombreJugador || !nombrePolera || !talla || !numeroPolera || !modelo) {
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
      nombreJugador: String(nombreJugador).trim(),
      nombrePolera: String(nombrePolera).trim().toUpperCase(),
      talla,
      numeroPolera: numInt,
      modelo,
      creadoEn: new Date(),
    });

    return res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyPattern?.numeroPolera) {
        return res.status(409).json({ error: `El número ${parseInt(numeroPolera, 10)} ya está en uso` });
      }
      if (err.keyPattern?.nombreJugador || err.keyPattern?.modelo) {
        return res.status(409).json({
          error: 'Ya existe un pedido para este jugador y modelo. Usa la opción de actualizar.',
        });
      }
      return res.status(409).json({ error: 'Ya existe un pedido con estos datos' });
    }
    console.error('post player error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PUT /api/players/:id — player self-update (nombrePolera + talla only) ────
router.put('/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const { nombrePolera, talla } = req.body;

  if (!nombrePolera || !talla) {
    return res.status(400).json({ error: 'Nombre en polera y talla son requeridos' });
  }

  if (!VALID_TALLAS.includes(talla)) {
    return res.status(400).json({ error: 'Talla inválida' });
  }

  try {
    const db = getDB();
    const updated = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          nombrePolera: String(nombrePolera).trim().toUpperCase(),
          talla,
          actualizadoEn: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    return res.json(updated);
  } catch (err) {
    console.error('put player error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PATCH /api/players/:id/numero — admin assigns shirt number (protected) ───
router.patch('/:id/numero', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const { numeroPolera } = req.body;
  const numInt = parseInt(numeroPolera, 10);

  if (isNaN(numInt) || numInt < 1 || numInt > 999) {
    return res.status(400).json({ error: 'Número de polera inválido (1–999)' });
  }

  try {
    const db = getDB();
    const objId = new ObjectId(id);

    // Check duplicate number excluding self
    const dup = await db.collection(COLLECTION).findOne({
      numeroPolera: numInt,
      _id: { $ne: objId },
    });
    if (dup) {
      return res.status(409).json({ error: `El número ${numInt} ya está en uso` });
    }

    const updated = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: objId },
      { $set: { numeroPolera: numInt, actualizadoEn: new Date() } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    return res.json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `El número ${numInt} ya está en uso` });
    }
    console.error('patch numero error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
