const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password || !process.env.REPORTS_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  if (password !== process.env.REPORTS_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  const token = jwt.sign({ role: 'reporter' }, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });

  return res.json({ token });
});

module.exports = router;
