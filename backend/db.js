// backend/db.js
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('Lector', 'Admin', 'DEV'))
  )
`);

const SEED_USERS = [
  { nombre: 'Matias Scigliano', email: 'mscigliano@american-ads.com', pin: '3108', rol: 'DEV' },
  { nombre: 'Nahuel Fernandez', email: 'nfernandez@american-ads.com', pin: '2026', rol: 'Admin' },
  { nombre: 'Axel Sangiacomo', email: 'asangiacomo@american-ads.com', pin: '2026', rol: 'Lector' },
];

const insert = db.prepare('INSERT OR IGNORE INTO users (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)');
for (const u of SEED_USERS) {
  const hash = bcrypt.hashSync(u.pin, 10);
  insert.run(u.nombre, u.email, hash, u.rol);
}

module.exports = db;
