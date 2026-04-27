require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim());

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/players', require('./routes/players'));
app.use('/api/fans', require('./routes/fans'));

let dbReady = false;

// Health check — reflects real DB readiness
app.get('/api/health', (_req, res) => {
  if (dbReady) return res.json({ status: 'ok' });
  return res.status(503).json({ status: 'starting' });
});

const PORT = process.env.PORT || 3001;

// Start HTTP server immediately so the container stays alive while DB connects
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Connect to MongoDB with retries — process never exits on failure
async function connectWithRetry(attempt = 1) {
  try {
    await connectDB();
    dbReady = true;
    console.log('Database ready.');
  } catch (err) {
    const delay = Math.min(attempt * 5000, 30000);
    console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}. Retrying in ${delay / 1000}s…`);
    setTimeout(() => connectWithRetry(attempt + 1), delay);
  }
}

connectWithRetry();
