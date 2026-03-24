// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { parseExcel, getSummary, readLocalData, writeLocalData } = require('./services/excelParser');
const { requireAuth, requireRole } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

// Guard: fail fast if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}

const app = express();
const PORT = 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Auth routes (public)
app.use('/api/auth', authRouter);

// Users routes (DEV only, protected inside router)
app.use('/api/users', usersRouter);

function getProjects() {
  return parseExcel();
}

// GET all projects
app.get('/api/projects', requireAuth, (req, res) => {
  try {
    const projects = getProjects();
    const { año, cliente, sheet, elemento } = req.query;
    let filtered = projects;
    if (año) filtered = filtered.filter(p => String(p.año) === año);
    if (cliente) filtered = filtered.filter(p => p.cliente && p.cliente.toLowerCase().includes(cliente.toLowerCase()));
    if (sheet) filtered = filtered.filter(p => p.sheet === sheet);
    if (elemento) filtered = filtered.filter(p => p.elemento && p.elemento.toLowerCase().includes(elemento.toLowerCase()));
    res.json({ success: true, data: filtered, total: filtered.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET summary / KPIs
app.get('/api/summary', requireAuth, (req, res) => {
  try {
    const { estado } = req.query;
    const projects = getProjects();
    const filtered = estado ? projects.filter(p => p.estado === estado) : projects;
    const summary = getSummary(filtered);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET campaigns
app.get('/api/campaigns', requireAuth, (req, res) => {
  try {
    const projects = getProjects();
    const campaigns = [...new Set(projects.map(p => p.sheet).filter(Boolean))].sort();
    res.json({ success: true, data: campaigns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create project
app.post('/api/projects', requireAuth, requireRole('Admin', 'DEV'), (req, res) => {
  try {
    const localData = readLocalData();
    const newProject = {
      ...req.body,
      estado: req.body.estado || 'Presupuestado',
      id: crypto.randomUUID(),
      source: 'local',
      createdAt: new Date().toISOString(),
    };
    localData.push(newProject);
    writeLocalData(localData);
    res.json({ success: true, data: newProject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT edit project
app.put('/api/projects/:id', requireAuth, requireRole('Admin', 'DEV'), (req, res) => {
  try {
    const { id } = req.params;
    const localData = readLocalData();
    const existing = localData.findIndex(p => p.id === id);
    const update = { ...req.body, id, updatedAt: new Date().toISOString() };

    if (existing >= 0) {
      localData[existing] = { ...localData[existing], ...update };
    } else {
      localData.push(update);
    }
    writeLocalData(localData);
    res.json({ success: true, data: update });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE project (soft delete)
app.delete('/api/projects/:id', requireAuth, requireRole('Admin', 'DEV'), (req, res) => {
  try {
    const { id } = req.params;
    const localData = readLocalData();
    const existing = localData.findIndex(p => p.id === id);

    if (existing >= 0) {
      localData[existing].deleted = true;
      localData[existing].deletedAt = new Date().toISOString();
    } else {
      localData.push({ id, deleted: true, deletedAt: new Date().toISOString() });
    }
    writeLocalData(localData);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
