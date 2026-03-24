const XLSX = require('xlsx');
const crypto = require('crypto');
const path = require('path');

const EXCEL_PATH = path.join(__dirname, '../../data/innovacion-creatividad.xlsx');
const LOCAL_PATH = path.join(__dirname, '../../data/projects-local.json');
const SKIP_SHEETS = ['PersOnal', 'Realizados'];

function parseNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'string' && (val.includes('DIV') || val.includes('#'))) return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function parseMonthToYear(val, currentYear) {
  if (!val) return null;
  const str = String(val).trim().toLowerCase();
  const months = {
    enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,
    julio:7,agosto:8,septiembre:9,octubre:10,noviembre:11,diciembre:12,
    ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,oct:10,nov:11,dic:12
  };
  if (months[str]) return `${currentYear}-${String(months[str]).padStart(2,'0')}-01`;
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) return str.split('T')[0];
  if (typeof val === 'number' && val > 40000) {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  }
  return null;
}

function isYearSeparator(row) {
  const v = row[0];
  if (v === null || v === undefined) return false;
  const str = String(v).trim();
  return str.match(/^202[0-9]$/) && (row[1] === null || String(row[1]).match(/^202[0-9]$/));
}

function isHeaderRow(row) {
  return String(row[0] || '').trim() === 'Fecha' && String(row[1] || '').trim() === 'Cliente';
}

function isMepaRow(row) {
  return String(row[1] || '').includes('MEPA');
}

function isEmptyRow(row) {
  return row.every(v => v === null || v === undefined || String(v).trim() === '');
}

function generateId(sheet, cliente, campaña, elemento, index) {
  const raw = `${sheet}|${cliente||''}|${campaña||''}|${elemento||''}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
  return index > 0 ? `${hash}_${index}` : hash;
}

function deriveCalculated(p) {
  const totalProd = (p.costoInn || 0) + (p.costoPlacaPai || 0) + (p.costoLona || 0) + (p.ws || 0) + (p.confiPct || 0);
  const margenAbs = (p.tarifa || 0) - totalProd;
  const margenPct = p.tarifa > 0 ? margenAbs / p.tarifa : 0;
  return { ...p, totalProd, margenAbs, margenPct };
}

function buildProject(row, sheetName, currentYear, lastCliente, lastCampaña) {
  const fecha = parseMonthToYear(row[0], currentYear);
  const cliente = String(row[1] || '').trim() || lastCliente;
  const campaña = String(row[2] || '').trim() || lastCampaña;

  return {
    fecha,
    año: currentYear,
    cliente: cliente || null,
    campaña: campaña || null,
    fotoRef: String(row[3] || '').trim() || null,
    formato: String(row[4] || '').trim() || null,
    elemento: String(row[5] || '').trim() || null,
    cantidad: parseNumber(row[6]),
    costoInn: parseNumber(row[7]),
    costoPlacaPai: parseNumber(row[8]),
    costoLona: parseNumber(row[9]),
    confiPct: parseNumber(row[10]),
    ws: parseNumber(row[11]),
    totalProd: parseNumber(row[12]),
    tarifa: parseNumber(row[13]),
    markUp: parseNumber(row[14]),
    margenPct: parseNumber(row[15]),
    margenAbs: parseNumber(row[16]),
    detalle: String(row[18] || '').trim() || null,
    elementoDueno: String(row[19] || '').trim() || null,
    ubicacion: String(row[20] || '').trim() || null,
    situacion: String(row[22] || '').trim() || null,
    realizacion: String(row[23] || '').trim() || null,
    fechaCampaña: String(row[25] || '').trim() || null,
    observaciones: String(row[26] || '').trim() || null,
    opAdelantoCliente: String(row[27] || '').trim() || null,
    opSaldoCliente: String(row[28] || '').trim() || null,
    sheet: sheetName,
    source: 'excel',
    estado: 'Presupuestado',
  };
}

function parseExcelRaw() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const projects = [];
  const seenIds = {};

  const projectSheets = wb.SheetNames.filter(name => !SKIP_SHEETS.includes(name));

  for (const sheetName of projectSheets) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

    let currentYear = 2025;
    let lastCliente = null;
    let lastCampaña = null;

    for (const row of rows) {
      if (!row || row.length === 0 || isEmptyRow(row)) continue;
      if (isHeaderRow(row)) continue;
      if (isMepaRow(row)) continue;

      if (isYearSeparator(row)) {
        currentYear = parseInt(String(row[0]).trim());
        lastCliente = null;
        lastCampaña = null;
        continue;
      }

      const project = buildProject(row, sheetName, currentYear, lastCliente, lastCampaña);

      if (String(row[1] || '').trim()) lastCliente = String(row[1]).trim();
      if (String(row[2] || '').trim()) lastCampaña = String(row[2]).trim();

      if (project.totalProd > 0 || project.tarifa > 0 || project.costoInn > 0) {
        // Generate stable ID with collision handling
        const baseId = generateId(sheetName, project.cliente, project.campaña, project.elemento, 0);
        const count = seenIds[baseId] || 0;
        const id = count > 0 ? generateId(sheetName, project.cliente, project.campaña, project.elemento, count) : baseId;
        seenIds[baseId] = count + 1;
        project.id = id;
        projects.push(project);
      }
    }
  }

  return projects;
}

function readLocalData() {
  try {
    const fs = require('fs');
    if (!fs.existsSync(LOCAL_PATH)) return [];
    return JSON.parse(fs.readFileSync(LOCAL_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function writeLocalData(data) {
  const fs = require('fs');
  fs.writeFileSync(LOCAL_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function parseExcel() {
  const excelProjects = parseExcelRaw();
  const localData = readLocalData();

  if (localData.length === 0) return excelProjects;

  const localMap = {};
  for (const entry of localData) {
    localMap[entry.id] = entry;
  }

  // Apply overrides to Excel projects
  const result = excelProjects
    .map(p => {
      const local = localMap[p.id];
      if (!local) return p;
      if (local.deleted) return null;
      return deriveCalculated({
        ...p,
        ...local,
        id: p.id,
        source: 'edited',
        estado: local.estado || p.estado || 'Presupuestado',
      });
    })
    .filter(Boolean);

  // Add new local-only projects (not in Excel)
  const excelIds = new Set(excelProjects.map(p => p.id));
  for (const entry of localData) {
    if (!entry.deleted && !excelIds.has(entry.id)) {
      result.push(deriveCalculated({ ...entry, source: 'local' }));
    }
  }

  return result;
}

function getSummary(projects) {
  const valid = projects.filter(p => p.tarifa > 0 || p.totalProd > 0);

  const totalTarifa = valid.reduce((s, p) => s + (p.tarifa || 0), 0);
  const totalProd = valid.reduce((s, p) => s + (p.totalProd || 0), 0);
  const totalMargenAbs = valid.reduce((s, p) => s + (p.margenAbs || 0), 0);
  const margenPct = totalTarifa > 0 ? (totalMargenAbs / totalTarifa) * 100 : 0;

  const byCliente = {};
  for (const p of valid) {
    const key = p.cliente || 'Sin cliente';
    if (!byCliente[key]) byCliente[key] = { cliente: key, tarifa: 0, totalProd: 0, margen: 0, count: 0 };
    byCliente[key].tarifa += p.tarifa || 0;
    byCliente[key].totalProd += p.totalProd || 0;
    byCliente[key].margen += p.margenAbs || 0;
    byCliente[key].count++;
  }

  const byCampaña = {};
  for (const p of valid) {
    const key = p.sheet || p.campaña || 'Sin campaña';
    if (!byCampaña[key]) byCampaña[key] = { campaña: key, tarifa: 0, totalProd: 0, margen: 0, count: 0 };
    byCampaña[key].tarifa += p.tarifa || 0;
    byCampaña[key].totalProd += p.totalProd || 0;
    byCampaña[key].margen += p.margenAbs || 0;
    byCampaña[key].count++;
  }

  const byAño = {};
  for (const p of valid) {
    const key = p.año || 'Sin año';
    if (!byAño[key]) byAño[key] = { año: key, tarifa: 0, totalProd: 0, margen: 0, count: 0 };
    byAño[key].tarifa += p.tarifa || 0;
    byAño[key].totalProd += p.totalProd || 0;
    byAño[key].margen += p.margenAbs || 0;
    byAño[key].count++;
  }

  const años = [...new Set(valid.map(p => p.año).filter(Boolean))].sort();

  // Comparative chart: current year vs previous year, grouped by quarter.
  // NOTE: projects currently only have year (no month), so all are assigned Q1.
  // When monthly dates are available, update getQuarter() to use p.fecha.
  function getQuarter(p) {
    if (p.fecha) {
      const month = new Date(p.fecha).getMonth() + 1;
      if (month <= 3) return 'Q1';
      if (month <= 6) return 'Q2';
      if (month <= 9) return 'Q3';
      return 'Q4';
    }
    return 'Q1'; // fallback: no date info
  }

  const añoActual = años.length > 0 ? Math.max(...años) : new Date().getFullYear();
  const añoAnterior = añoActual - 1;
  const emptyQuarters = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

  const actualByQ = { ...emptyQuarters };
  const anteriorByQ = { ...emptyQuarters };

  for (const p of valid) {
    if (p.año === añoActual) actualByQ[getQuarter(p)] += p.tarifa || 0;
    if (p.año === añoAnterior) anteriorByQ[getQuarter(p)] += p.tarifa || 0;
  }

  const comparativoAnual = {
    añoActual,
    añoAnterior,
    actual: actualByQ,
    anterior: anteriorByQ,
  };

  return {
    totalProjects: valid.length,
    totalTarifa,
    totalProd,
    totalMargenAbs,
    margenPct: Math.round(margenPct * 10) / 10,
    años,
    byCliente: Object.values(byCliente).sort((a, b) => b.tarifa - a.tarifa),
    byCampaña: Object.values(byCampaña).sort((a, b) => b.tarifa - a.tarifa),
    byAño: Object.values(byAño).sort((a, b) => a.año - b.año),
    comparativoAnual,
  };
}

module.exports = { parseExcel, getSummary, readLocalData, writeLocalData };
