import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { formatARS, formatPct } from '../utils/format';

// ─── Elementos ────────────────────────────────────────────────────────────────
const ELEMENTOS_BASE = [
  'Pórticos', 'Cartel Frontlight', 'Carteles Full Neón', 'Murales + Paste Up',
  'Proyecciones', 'Proyecciones Subte', 'Medianeras', 'Mupis', 'Refugios',
  'PPL', 'PPL digitales', 'Líneas de Colectivos', 'Trenes', 'Subtes',
  'Intervenciones en Edificios', 'Acciones BTL', 'Cubo Móvil', 'Show de Drones',
  'Videos CGI', '3D - Contenido Anamórfico', 'Bajo Puentes', 'Lenticulares', 'CPM',
];

const STORAGE_KEY = 'dashboard_elementos_custom';

function getElementos() {
  try {
    const custom = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return [...new Set([...ELEMENTOS_BASE, ...custom])];
  } catch {
    return ELEMENTOS_BASE;
  }
}

function saveCustomElemento(val) {
  if (!val?.trim() || ELEMENTOS_BASE.includes(val.trim())) return;
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!existing.includes(val.trim())) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, val.trim()]));
    }
  } catch {}
}

const today = () => new Date().toISOString().split('T')[0];

// ─── Styles ───────────────────────────────────────────────────────────────────
const sectionLabelStyle = {
  fontSize: '10px', fontFamily: 'var(--sans)', fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em',
};

const labelStyle = {
  fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--sans)',
  fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
  display: 'block', marginBottom: '5px',
};

const inputStyle = {
  background: 'var(--bg-base)',
  border: '1px solid rgba(255,106,185,0.2)',
  borderRadius: '8px',
  padding: '10px 14px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  fontFamily: 'var(--sans)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};

const onFocus = e => (e.target.style.borderColor = 'var(--accent)');
const onBlur  = e => (e.target.style.borderColor = 'rgba(255,106,185,0.2)');

// ─── Sub-components ───────────────────────────────────────────────────────────
function Field({ label, children, required, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={labelStyle}>{label}{required && <span style={{ color: 'var(--accent)', marginLeft: 2 }}>*</span>}</label>
      {children}
      {error && <p style={{ fontSize: '11px', color: 'var(--negative)', marginTop: 0 }}>{error}</p>}
    </div>
  );
}

function NumInput({ value, onChange, placeholder = '0', min }) {
  return (
    <input
      type="number"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      style={inputStyle}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,106,185,0.1)' }} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const EMPTY = {
  cliente: '', campaña: '', elemento: '', cantidad: 1,
  costoInn: '', costoPlacaPai: '', costoLona: '', ws: '', confi: '',
  tarifa: '', descuento: '',
  estado: 'Presupuestado', observaciones: '', fecha: today(),
};

export default function ProjectModal({ project, onClose, onSaved }) {
  const isNew = !project?.id;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const [elementos, setElementos] = useState(getElementos);

  useEffect(() => {
    if (project) {
      setForm({
        cliente:      project.cliente      || '',
        campaña:      project.campaña      || '',
        elemento:     project.elemento     || '',
        cantidad:     project.cantidad     ?? 1,
        costoInn:     project.costoInn     ?? '',
        costoPlacaPai:project.costoPlacaPai?? '',
        costoLona:    project.costoLona    ?? '',
        ws:           project.ws           ?? '',
        confi:        project.confiPct     ?? '',
        tarifa:       project.tarifa       ?? '',
        descuento:    project.descuento    ?? '',
        estado:       project.estado       || 'Presupuestado',
        observaciones:project.observaciones|| '',
        fecha:        project.fecha        || today(),
      });
    } else {
      setForm({ ...EMPTY, fecha: today() });
    }
    setTouched({});
  }, [project]);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
  const touch = key => () => setTouched(t => ({ ...t, [key]: true }));
  const num = v => parseFloat(v) || 0;

  // ─── Live calculations ───────────────────────────────────────────────────
  const calc = useMemo(() => {
    const cant       = Math.max(1, num(form.cantidad));
    const costoUnit  = num(form.costoInn) + num(form.costoPlacaPai)
                     + num(form.costoLona) + num(form.ws) + num(form.confi);
    const totalProd  = costoUnit * cant;
    const tarifaBase = num(form.tarifa) * cant;
    const desc       = Math.min(100, Math.max(0, num(form.descuento)));
    const tarifaFinal= tarifaBase * (1 - desc / 100);
    const margenAbs  = tarifaFinal - totalProd;
    const margenPct  = tarifaFinal > 0 ? margenAbs / tarifaFinal : 0;
    const markUp     = totalProd  > 0 ? tarifaFinal / totalProd   : 0;
    return { totalProd, tarifaFinal, margenAbs, margenPct, markUp };
  }, [form.costoInn, form.costoPlacaPai, form.costoLona, form.ws, form.confi,
      form.tarifa, form.cantidad, form.descuento]);

  const margenColor = calc.margenPct >= 0.3 ? 'var(--positive)'
                    : calc.margenPct >= 0   ? '#F59E0B'
                    :                         'var(--negative)';
  const markUpColor = calc.markUp >= 1.3 ? 'var(--positive)'
                    : calc.markUp >= 1   ? '#F59E0B'
                    :                      'var(--negative)';

  const isValid = form.cliente.trim() !== '' && num(form.tarifa) > 0;

  // ─── Save ────────────────────────────────────────────────────────────────
  async function handleSave() {
    setTouched({ cliente: true, tarifa: true });
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      saveCustomElemento(form.elemento);
      setElementos(getElementos());

      const fechaVal = form.fecha || today();
      const año = new Date(fechaVal).getFullYear();

      const payload = {
        cliente:       form.cliente,
        campaña:       form.campaña,
        elemento:      form.elemento,
        cantidad:      num(form.cantidad) || 1,
        costoInn:      num(form.costoInn),
        costoPlacaPai: num(form.costoPlacaPai),
        costoLona:     num(form.costoLona),
        ws:            num(form.ws),
        confiPct:      num(form.confi),
        tarifa:        num(form.tarifa),
        descuento:     num(form.descuento),
        estado:        form.estado,
        observaciones: form.observaciones,
        fecha:         fechaVal,
        año,
        sheet: project?.sheet || form.campaña || form.cliente || 'Local',
        // Computed — stored for export/table display
        totalProd:   calc.totalProd,
        tarifaFinal: calc.tarifaFinal,
        margenAbs:   calc.margenAbs,
        margenPct:   calc.margenPct,
        markUp:      calc.markUp,
      };

      if (isNew) {
        await api.post('/api/projects', payload);
      } else {
        await api.put(`/api/projects/${project.id}`, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '100%', maxWidth: '700px', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh', background: 'var(--bg-surface)', border: '1px solid rgba(255,106,185,0.2)', boxShadow: '0 0 60px rgba(255,106,185,0.12)' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid rgba(255,106,185,0.15)', flexShrink: 0 }}>
          <p style={{ fontFamily: 'var(--display)', fontSize: '16px', color: 'var(--accent)', letterSpacing: '0.05em' }}>
            {isNew ? '+ NUEVO PROYECTO' : 'EDITAR PROYECTO'}
          </p>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '4px' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >✕</button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div style={{ overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 1 · Proyecto */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={sectionLabelStyle}>Proyecto</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Cliente" required error={touched.cliente && !form.cliente.trim() ? 'Requerido' : ''}>
                <input
                  type="text" value={form.cliente} onChange={set('cliente')}
                  onBlur={e => { touch('cliente')(); onBlur(e); }}
                  onFocus={onFocus}
                  placeholder="Ej: Disney" style={inputStyle}
                />
              </Field>
              <Field label="Campaña">
                <input
                  type="text" value={form.campaña} onChange={set('campaña')}
                  placeholder="Ej: Mandalorian" style={inputStyle}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
              <Field label="Elemento">
                <input
                  list="elementos-list" value={form.elemento} onChange={set('elemento')}
                  placeholder="Seleccioná o escribí un elemento" style={inputStyle}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <datalist id="elementos-list">
                  {elementos.map(e => <option key={e} value={e} />)}
                </datalist>
              </Field>
              <Field label="Cantidad">
                <NumInput value={form.cantidad} onChange={set('cantidad')} placeholder="1" min="1" />
              </Field>
            </div>
          </section>

          <Divider />

          {/* 2 · Costos */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={sectionLabelStyle}>Costos unitarios (ARS)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              <Field label="Costo Innovación"><NumInput value={form.costoInn}      onChange={set('costoInn')} /></Field>
              <Field label="Costo Placa PAI"> <NumInput value={form.costoPlacaPai} onChange={set('costoPlacaPai')} /></Field>
              <Field label="Costo Lona">      <NumInput value={form.costoLona}     onChange={set('costoLona')} /></Field>
              <Field label="WS">              <NumInput value={form.ws}            onChange={set('ws')} /></Field>
              <Field label="Confi $">         <NumInput value={form.confi}         onChange={set('confi')} /></Field>
            </div>
          </section>

          <Divider />

          {/* 3 · Tarifa */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={sectionLabelStyle}>Tarifa</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Tarifa unitaria" required error={touched.tarifa && !num(form.tarifa) ? 'Requerido' : ''}>
                <NumInput
                  value={form.tarifa}
                  onChange={set('tarifa')}
                />
              </Field>
              <Field label="Descuento %">
                <NumInput value={form.descuento} onChange={set('descuento')} placeholder="0" />
              </Field>
            </div>
          </section>

          {/* 4 · Resultados live */}
          <div style={{ background: 'rgba(9,9,16,0.8)', border: '1px solid rgba(255,106,185,0.2)', borderRadius: '12px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ ...sectionLabelStyle, color: 'var(--accent)' }}>Resultados en tiempo real</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
              {[
                { label: 'Producción',   val: formatARS(calc.totalProd),   color: 'var(--text-primary)' },
                { label: 'Tarifa total', val: formatARS(calc.tarifaFinal), color: 'var(--accent)' },
                { label: 'Mark Up',      val: calc.totalProd > 0 ? `${calc.markUp.toFixed(2)}x` : '—', color: markUpColor },
                { label: 'Margen ARS',   val: formatARS(calc.margenAbs),   color: margenColor },
                { label: 'Margen %',     val: formatPct(calc.margenPct),   color: margenColor },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{label}</p>
                  <p style={{ fontFamily: 'var(--display)', fontSize: '20px', color, lineHeight: 1 }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          {/* 5 · Info */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: !isNew ? '1fr 1fr' : '1fr', gap: '14px' }}>
              <Field label="Estado">
                <select value={form.estado} onChange={set('estado')} style={inputStyle}>
                  <option value="Presupuestado">Presupuestado</option>
                  <option value="Realizado">Realizado</option>
                </select>
              </Field>
              {!isNew && (
                <Field label="Fecha">
                  <input
                    type="date" value={form.fecha} onChange={set('fecha')}
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </Field>
              )}
            </div>
            <Field label="Observaciones">
              <textarea
                value={form.observaciones} onChange={set('observaciones')}
                placeholder="Notas adicionales..." rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--sans)' }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </Field>
          </section>

          {error && (
            <p style={{ fontSize: '12px', color: 'var(--negative)', textAlign: 'center', padding: '8px 12px', background: 'rgba(255,77,109,0.08)', borderRadius: '8px', border: '1px solid rgba(255,77,109,0.2)' }}>
              {error}
            </p>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '20px 28px', borderTop: '1px solid rgba(255,106,185,0.15)', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 24px', borderRadius: '10px', color: 'var(--text-muted)', border: '1px solid rgba(255,106,185,0.2)', background: 'transparent', fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,106,185,0.5)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,106,185,0.2)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '10px 28px', borderRadius: '10px', background: isValid ? 'linear-gradient(135deg, #FF6AB9, #e040a0)' : 'rgba(255,106,185,0.08)', color: isValid ? '#fff' : 'rgba(255,106,185,0.35)', border: isValid ? 'none' : '1px solid rgba(255,106,185,0.15)', cursor: isValid && !saving ? 'pointer' : 'not-allowed', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.03em', opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s' }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
