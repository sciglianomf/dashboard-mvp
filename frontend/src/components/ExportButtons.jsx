import * as XLSX from 'xlsx';

function exportToExcel(projects) {
  const rows = projects.map(p => ({
    'Campaña': p.sheet,
    'Cliente': p.cliente || '',
    'Campaña (nombre)': p.campaña || '',
    'Elemento': p.elemento || '',
    'Formato': p.formato || '',
    'Cantidad': p.cantidad,
    'Costo Innovación': p.costoInn,
    'Costo Placa PAI': p.costoPlacaPai,
    'Costo Lona': p.costoLona,
    'Total Producción': p.totalProd,
    'Tarifa': p.tarifa,
    'Margen ARS': p.margenAbs,
    'Margen %': p.margenPct ? (p.margenPct * 100).toFixed(1) + '%' : '',
    'Situación': p.situacion || '',
    'Observaciones': p.observaciones || '',
    'Año': p.año,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Array(17).fill({ wch: 18 });
  XLSX.utils.book_append_sheet(wb, ws, 'Proyectos');
  XLSX.writeFile(wb, `inn-creatividad-${new Date().toISOString().split('T')[0]}.xlsx`);
}

function exportToPDF(projects, summary, estado) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Dashboard Innovación & Creatividad</title>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@300;400;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Archivo', sans-serif; background: #090910; color: #E2E8F0; padding: 32px; }
  h1 { font-family: 'Anton', sans-serif; font-size: 24px; color: #FF6AB9; margin-bottom: 4px; letter-spacing: 0.05em; }
  .sub { color: #6b7280; font-size: 12px; font-family: 'Archivo', sans-serif; margin-bottom: 28px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .kpi { background: linear-gradient(135deg, rgba(255,106,185,0.13), rgba(9,9,16,0.95)); border: 1px solid rgba(255,106,185,0.2); border-radius: 10px; padding: 14px; }
  .kpi-label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.12em; font-family: 'Archivo', sans-serif; font-weight: 600; margin-bottom: 6px; }
  .kpi-value { font-size: 24px; font-family: 'Anton', sans-serif; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: rgba(255,106,185,0.08); text-align: left; padding: 8px 12px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; font-family: 'Archivo', sans-serif; font-weight: 600; }
  td { padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); font-family: 'Archivo', sans-serif; }
  .r { text-align: right; }
  .green { color: #34d399; }
  .pink { color: #FF6AB9; font-weight: 600; }
  .wrap { background: linear-gradient(135deg, rgba(255,106,185,0.08), rgba(9,9,16,0.95)); border: 1px solid rgba(255,106,185,0.2); border-radius: 12px; overflow: hidden; }
</style>
</head><body>
<h1>INNOVACIÓN & CREATIVIDAD</h1>
<p class="sub">Dashboard Ejecutivo · ${new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })} · Vista: ${estado || 'Presupuestado'}</p>
<div class="kpis">
  <div class="kpi"><div class="kpi-label">Proyectos</div><div class="kpi-value">${summary?.totalProjects || 0}</div></div>
  <div class="kpi"><div class="kpi-label">Tarifa Total</div><div class="kpi-value" style="color:#FF6AB9">$${((summary?.totalTarifa||0)/1e6).toFixed(1)}M</div></div>
  <div class="kpi"><div class="kpi-label">Producción</div><div class="kpi-value">$${((summary?.totalProd||0)/1e6).toFixed(1)}M</div></div>
  <div class="kpi"><div class="kpi-label">Margen</div><div class="kpi-value" style="color:#34d399">${summary?.margenPct||0}%</div></div>
</div>
<div class="wrap">
<table>
<thead><tr><th>Campaña</th><th>Cliente</th><th>Elemento</th><th class="r">Producción</th><th class="r">Tarifa</th><th class="r">Margen</th><th class="r">Mg%</th></tr></thead>
<tbody>
${projects.slice(0, 60).map(p => `<tr>
  <td class="pink">${p.sheet}</td>
  <td>${p.cliente||'—'}</td>
  <td style="color:#6b7280">${p.elemento||p.formato||'—'}</td>
  <td class="r" style="color:#6b7280">$${((p.totalProd||0)/1e6).toFixed(1)}M</td>
  <td class="r"><strong>$${((p.tarifa||0)/1e6).toFixed(1)}M</strong></td>
  <td class="r green">$${((p.margenAbs||0)/1e6).toFixed(1)}M</td>
  <td class="r">${p.margenPct?(p.margenPct*100).toFixed(1)+'%':'—'}</td>
</tr>`).join('')}
</tbody>
</table>
</div>
${projects.length > 60 ? `<p style="color:#6b7280;font-size:11px;margin-top:8px;font-family:Archivo,sans-serif">+ ${projects.length-60} proyectos más</p>` : ''}
</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}

const btnBase = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
  fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
  fontFamily: 'var(--sans)', border: '1px solid var(--accent)',
  background: 'transparent', color: 'var(--accent)',
};

export default function ExportButtons({ projects, summary, estado }) {
  return (
    <div className="flex gap-2">
      <button
        style={btnBase}
        onClick={() => exportToExcel(projects)}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; }}
      >
        ↓ Excel
      </button>
      <button
        style={btnBase}
        onClick={() => exportToPDF(projects, summary, estado)}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; }}
      >
        ↓ PDF
      </button>
    </div>
  );
}
