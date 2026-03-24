// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_DOMAIN = '@american-ads.com';
const PIN_REGEX = /^\d{4}$/;
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
};

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, pin } = req.body;

  if (!email || !email.endsWith(ALLOWED_DOMAIN)) {
    return res.status(401).json({ success: false, error: 'Dominio no autorizado. Solo @american-ads.com' });
  }
  if (!pin || !PIN_REGEX.test(pin)) {
    return res.status(400).json({ success: false, error: 'PIN inválido. Debe ser exactamente 4 dígitos' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
  }

  const valid = bcrypt.compareSync(pin, user.password_hash);
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
  }

  const payload = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ success: true, data: payload });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;
