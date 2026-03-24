// backend/routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const PIN_REGEX = /^\d{4}$/;
const VALID_ROLES = ['Lector', 'Admin', 'DEV'];

// All users routes require DEV role
router.use(requireAuth, requireRole('DEV'));

// GET /api/users
router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, nombre, email, rol FROM users ORDER BY id').all();
  res.json({ success: true, data: users });
});

// POST /api/users
router.post('/', (req, res) => {
  const { nombre, email, pin, rol } = req.body;

  if (!nombre || !email || !pin || !rol) {
    return res.status(400).json({ success: false, error: 'Todos los campos son requeridos' });
  }
  if (!email.endsWith('@american-ads.com')) {
    return res.status(400).json({ success: false, error: 'Dominio no autorizado' });
  }
  if (!PIN_REGEX.test(pin)) {
    return res.status(400).json({ success: false, error: 'PIN debe ser exactamente 4 dígitos' });
  }
  if (!VALID_ROLES.includes(rol)) {
    return res.status(400).json({ success: false, error: 'Rol inválido' });
  }

  const hash = bcrypt.hashSync(pin, 10);
  try {
    const result = db.prepare('INSERT INTO users (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)')
      .run(nombre, email, hash, rol);
    const user = db.prepare('SELECT id, nombre, email, rol FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, error: 'El email ya está registrado' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, email, pin, rol } = req.body;

  if (!nombre || !email || !rol) {
    return res.status(400).json({ success: false, error: 'Nombre, email y rol son requeridos' });
  }
  if (!email.endsWith('@american-ads.com')) {
    return res.status(400).json({ success: false, error: 'Dominio no autorizado' });
  }
  if (!VALID_ROLES.includes(rol)) {
    return res.status(400).json({ success: false, error: 'Rol inválido' });
  }
  if (pin && !PIN_REGEX.test(pin)) {
    return res.status(400).json({ success: false, error: 'PIN debe ser exactamente 4 dígitos' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

  if (pin) {
    const hash = bcrypt.hashSync(pin, 10);
    db.prepare('UPDATE users SET nombre=?, email=?, password_hash=?, rol=? WHERE id=?')
      .run(nombre, email, hash, rol, id);
  } else {
    db.prepare('UPDATE users SET nombre=?, email=?, rol=? WHERE id=?')
      .run(nombre, email, rol, id);
  }

  const updated = db.prepare('SELECT id, nombre, email, rol FROM users WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);

  if (id === req.user.id) {
    return res.status(403).json({ success: false, error: 'No podés eliminar tu propio usuario' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
