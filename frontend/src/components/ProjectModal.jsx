import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { formatARSFull, formatPct } from '../utils/format';
import { AREAS } from '../utils/permissions';

const fmt = (v) => formatARSFull(v);

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
  fontSize: '10px',
  fontFamily: 'var(--sans)',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
};

const labelStyle = {
  fontSize: '10px',
  color: 'var(--text-muted)',
  fontFamily: 'var(--sans)',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '5px',
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

const finanzasInputStyle = {
  ...inputStyle,
  border: '1px solid rgba(52,211,153,0.3)',
};

const onFocus = (e) => (e.target.style.borderColor = 'var(--accent)');
const onBlur  = (e) => (e.target.style.borderColor = 'rgba(255,106,185,0.2)');
const onFocusFinanzas = (e) => (e.target.style.borderColor = '#34d399');
const onBlurFinanzas  = (e) => (e.target.style.borderColor = 'rgba(52,211,153,0.3)');

// ─── Sub-components ───────────────────────────────────────────────────────────
function Field({ label, children, required, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: 'var(--accent)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: '11px', color: 'var(--negative)', marginTop: 0 }}>{error}</p>
      )}
    </div>
  );
}

function NumInput({ value, onChange, placeholder = '0', min, finanzas }) {
  return (
    <input
      type="number"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      style={finanzas ? finanzasInputStyle : inputStyle}
      onFocus={finanzas ? onFocusFinanzas : onFocus}
      onBlur={finanzas ? onBlurFinanzas : onBlur}
    />
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,106,185,0.1)' }} />;
}

// ─── EMPTY form state ─────────────────────────────────────────────────────────
const EMPTY = {
  area: '',
  op_numero: '',
  cliente: '',
  campaña: '',
  elemento: '',
  cantidad: 1,
  costoInn: '',
  costoPlacaPai: '',
  costoLona: '',
  otroProveedorGasto: '',
  confi: '',
  tarifa: '',
  margenObj: '',
  descuento: '',
  estado: 'Presupuestado',
  observaciones: '',
  fecha: today(),
  gastoEstructuraPct: '',
};

function costoUnitFromForm(f) {
  const p = (v) => parseFloat(v) || 0;
  return p(f.costoInn) + p(f.costoPlacaPai) + p(f.costoLona) + p(f.otroProveedorGasto) + p(f.confi);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProjectModal({
  project,
  onClose,
  onSaved,
  defaultArea = '',
  showGastoEstructura = false,
  user = null,
}) {
  const isDev = user?.rol === 'DEV';
  const isNew = !project?.id;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const [elementos, setElementos] = useState(getElementos);

  useEffect(() => {
    if (project) {
      const costoInn          = project.costo_inn          ?? project.costoInn          ?? '';
      const costoPlacaPai     = project.costo_placa_pai    ?? project.costoPlacaPai     ?? '';
      const costoLona         = project.costo_lona         ?? project.costoLona         ?? '';
      // V3: leer otro_proveedor_gasto, fallback a ws por compatibilidad
      const otroProveedorGasto = project.otro_proveedor_gasto ?? project.ws ?? '';
      const confiPct          = project.confi_pct          ?? project.confiPct          ?? '';
      const tarifa            = project.tarifa             ?? '';
      const fecha             = project.fecha              ?? today();
      const observaciones     = project.observaciones      ?? '';
      const estado            = project.estado             || 'Presupuestado';
      const gastoEstructuraPct = project.gasto_estructura_pct ?? '';

      setForm({
        area: project.area || defaultArea || '',
        op_numero: project.op_numero || '',
        cliente: project.cliente || '',
        campaña: project.campaña || '',
        elemento: project.elemento || '',
        cantidad: project.cantidad ?? 1,
        costoInn,
        costoPlacaPai,
        costoLona,
        otroProveedorGasto,
        confi: confiPct,
        tarifa,
        margenObj: (() => {
          const t = parseFloat(tarifa) || 0;
          const cu =
            (parseFloat(costoInn) || 0) +
            (parseFloat(costoPlacaPai) || 0) +
            (parseFloat(costoLona) || 0) +
            (parseFloat(otroProveedorGasto) || 0) +
            (parseFloat(confiPct) || 0);
          return t > 0 && cu > 0 ? ((t - cu) / t * 100).toFixed(1) : '';
        })(),
        descuento: project.descuento ?? '',
        estado,
        observaciones,
        fecha,
        gastoEstructuraPct,
      });
    } else {
      setForm({ ...EMPTY, fecha: today(), area: defaultArea || '' });
    }
    setTouched({});
  }, [project, defaultArea]);

  const set   = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const touch = (key) => () => setTouched((t) => ({ ...t, [key]: true }));
  const num   = (v) => parseFloat(v) || 0;

  function handleTarifaChange(e) {
    const val = e.target.value;
    setForm((f) => {
      const t = parseFloat(val) || 0;
      const cu = costoUnitFromForm(f);
      const newMargen = t > 0 && cu > 0 ? ((t - cu) / t * 100).toFixed(1) : '';
      return { ...f, tarifa: val, margenObj: newMargen };
    });
  }

  function handleMargenChange(e) {
    const val = e.target.value;
    setForm((f) => {
      const m = parseFloat(val);
      const cu = costoUnitFromForm(f);
      if (!isNaN(m) && m < 100 && cu > 0) {
        const newTarifa = Math.round(cu / (1 - m / 100));
        return { ...f, margenObj: val, tarifa: String(newTarifa) };
      }
      return { ...f, margenObj: val };
    });
  }

  const calc = useMemo(() => {
    const cant        = Math.max(1, num(form.cantidad));
    const costoUnit   =
      num(form.costoInn) +
      num(form.costoPlacaPai) +
      num(form.costoLona) +
      num(form.otroProveedorGasto) +
      num(form.confi);
    const totalProd   = costoUnit * cant;
    const tarifaBase  = num(form.tarifa) * cant;
    const desc        = Math.min(100, Math.max(0, num(form.descuento)));
    const tarifaFinal = tarifaBase * (1 - desc / 100);
    const margenAbs   = tarifaFinal - totalProd;
    const margenPct   = tarifaFinal > 0 ? margenAbs / tarifaFinal : 0;
    const markUp      = totalProd > 0 ? tarifaFinal / totalProd - 1 : 0;
    // Gasto de estructura: (venta_neta * pct / 100) - confi_total
    const confiTotal  = num(form.confi) * cant;
    const gastoEstructuraValor =
      tarifaFinal > 0 && num(form.gastoEstructuraPct) > 0
        ? (tarifaFinal * num(form.gastoEstructuraPct) / 100) - confiTotal
        : 0;
    return { totalProd, tarifaFinal, margenAbs, margenPct, markUp, gastoEstructuraValor };
  }, [
    form.costoInn,
    form.costoPlacaPai,
    form.costoLona,
    form.otroProveedorGasto,
    form.confi,
    form.tarifa,
    form.cantidad,
    form.descuento,
    form.gastoEstructuraPct,
  ]);

  const margenColor =
    calc.margenPct >= 0.3
      ? 'var(--positive)'
      : calc.margenPct >= 0
        ? '#F59E0B'
        : 'var(--negative)';

  const markUpColor =
    calc.markUp >= 0.3
      ? 'var(--positive)'
      : calc.markUp >= 0
        ? '#F59E0B'
        : 'var(--negative)';

  const isValid = form.cliente.trim() !== '' && num(form.tarifa) > 0;

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

      // Área: DEV puede elegirla; el resto siempre usa su area_principal
      const areaFinal = isDev
        ? (form.area || defaultArea || 'Creatividad')
        : (user?.area_principal || defaultArea || 'Creatividad');

      const payload = {
        id: project?.id || crypto.randomUUID(),
        fecha: fechaVal,
        año,
        area: areaFinal,
        op_numero: form.op_numero?.trim() || null,
        cliente: form.cliente.trim() || null,
        campaña: form.campaña.trim() || null,
        sheet: project?.sheet || form.campaña?.trim() || form.cliente?.trim() || 'Local',
        estado: form.estado || 'Presupuestado',
        formato: project?.formato || null,
        elemento: form.elemento.trim() || null,
        cantidad: num(form.cantidad) || 1,
        detalle: project?.detalle || null,
        elemento_dueno: project?.elemento_dueno ?? project?.elementoDueno ?? null,
        ubicacion: project?.ubicacion || null,
        situacion: project?.situacion || null,
        realizacion: project?.realizacion || null,
        fecha_campaña: project?.fecha_campaña ?? project?.fechaCampaña ?? null,
        observaciones: form.observaciones || null,
        costo_inn: num(form.costoInn),
        costo_placa_pai: num(form.costoPlacaPai),
        costo_lona: num(form.costoLona),
        confi_pct: num(form.confi),
        // V3: escribir a otro_proveedor_gasto; mantener ws para compatibilidad
        otro_proveedor_gasto: num(form.otroProveedorGasto),
        ws: num(form.otroProveedorGasto),
        total_prod: calc.totalProd,
        tarifa: calc.tarifaFinal,
        mark_up: calc.markUp,
        margen_pct: calc.margenPct,
        margen_abs: calc.margenAbs,
        // Gasto estructura: solo se actualiza si el usuario tiene permiso
        gasto_estructura_pct: showGastoEstructura
          ? num(form.gastoEstructuraPct)
          : (project?.gasto_estructura_pct ?? 0),
        gasto_estructura_valor: showGastoEstructura
          ? calc.gastoEstructuraValor
          : (project?.gasto_estructura_valor ?? 0),
        op_adelanto_cliente: project?.op_adelanto_cliente ?? project?.opAdelantoCliente ?? null,
        op_saldo_cliente: project?.op_saldo_cliente ?? project?.opSaldoCliente ?? null,
        deleted: false,
      };

      if (isNew) {
        const { error: insertError } = await supabase.from('projects').insert([payload]);
        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', project.id);
        if (updateError) throw updateError;
      }

      onSaved();
    } catch (err) {
      console.error('Error guardando proyecto:', err);
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  // Resultados tiempo real: columnas base + gasto estructura si aplica
  const resultItems = [
    { label: 'Producción',   val: fmt(calc.totalProd),   color: 'var(--text-primary)' },
    { label: 'Tarifa total', val: fmt(calc.tarifaFinal), color: 'var(--accent)' },
    {
      label: 'Mark Up',
      val: calc.totalProd > 0 ? `${(calc.markUp * 100).toFixed(1)}%` : '—',
      color: markUpColor,
    },
    { label: 'Margen ARS', val: fmt(calc.margenAbs),   color: margenColor },
    { label: 'Margen %',   val: formatPct(calc.margenPct), color: margenColor },
    ...(showGastoEstructura
      ? [{ label: 'Gasto Estructura', val: fmt(calc.gastoEstructuraValor), color: 'var(--negative)' }]
      : []),
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: '720px',
          borderRadius: '16px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', maxHeight: '92vh',
          background: 'var(--bg-surface)',
          border: '1px solid rgba(255,106,185,0.2)',
          boxShadow: '0 0 60px rgba(255,106,185,0.12)',
        }}
      >
        {/* Header */}
        <div
          className="modal-header-bar"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 28px', borderBottom: '1px solid rgba(255,106,185,0.15)', flexShrink: 0,
          }}
        >
          <p style={{ fontFamily: 'var(--display)', fontSize: '16px', color: 'var(--accent)', letterSpacing: '0.05em' }}>
            {isNew ? '+ NUEVO PROYECTO' : 'EDITAR PROYECTO'}
          </p>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '4px' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          className="modal-body-scroll"
          style={{ overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          {/* ── Sección: Proyecto ── */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={sectionLabelStyle}>Proyecto</p>

            {/* Área (solo DEV) + OP */}
            <div
              className="modal-grid-2"
              style={{ display: 'grid', gridTemplateColumns: isDev ? '1fr 1fr' : '1fr', gap: '14px' }}
            >
              {isDev && (
                <Field label="Área" required>
                  <select
                    value={form.area}
                    onChange={set('area')}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  >
                    <option value="">Seleccionar área…</option>
                    {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </Field>
              )}
              <Field label="N° de OP">
                <input
                  type="text"
                  value={form.op_numero}
                  onChange={set('op_numero')}
                  placeholder="Ej: OP-2024-001"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </Field>
            </div>

            {/* Cliente + Campaña */}
            <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field
                label="Cliente"
                required
                error={touched.cliente && !form.cliente.trim() ? 'Requerido' : ''}
              >
                <input
                  type="text"
                  value={form.cliente}
                  onChange={set('cliente')}
                  onBlur={(e) => { touch('cliente')(); onBlur(e); }}
                  onFocus={onFocus}
                  placeholder="Ej: Disney"
                  style={inputStyle}
                />
              </Field>
              <Field label="Campaña">
                <input
                  type="text"
                  value={form.campaña}
                  onChange={set('campaña')}
                  placeholder="Ej: Mandalorian"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </Field>
            </div>

            {/* Elemento + Cantidad */}
            <div className="modal-grid-2-1" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
              <Field label="Elemento">
                <input
                  list="elementos-list"
                  value={form.elemento}
                  onChange={set('elemento')}
                  placeholder="Seleccioná o escribí un elemento"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <datalist id="elementos-list">
                  {elementos.map((e) => <option key={e} value={e} />)}
                </datalist>
              </Field>
              <Field label="Cantidad">
                <NumInput value={form.cantidad} onChange={set('cantidad')} placeholder="1" min="1" />
              </Field>
            </div>
          </section>

          <Divider />

          {/* ── Sección: Costos ── */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={sectionLabelStyle}>Costos unitarios (ARS)</p>
            <div className="modal-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              <Field label="Costo Innovación">
                <NumInput value={form.costoInn} onChange={set('costoInn')} />
              </Field>
              <Field label="Costo Placa PAI">
                <NumInput value={form.costoPlacaPai} onChange={set('costoPlacaPai')} />
              </Field>
              <Field label="Costo Lona">
                <NumInput value={form.costoLona} onChange={set('costoLona')} />
              </Field>
              <Field label="Otro Proveedor">
                <NumInput value={form.otroProveedorGasto} onChange={set('otroProveedorGasto')} />
              </Field>
              <Field label="Confi $">
                <NumInput value={form.confi} onChange={set('confi')} />
              </Field>
              {/* Campo Gasto Estructura % — solo para Finanzas/DEV */}
              {showGastoEstructura && (
                <Field label="Gasto Estructura %">
                  <div style={{ position: 'relative' }}>
                    <NumInput
                      value={form.gastoEstructuraPct}
                      onChange={set('gastoEstructuraPct')}
                      placeholder="0"
                      finanzas
                    />
                    <span
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        fontSize: '9px', color: '#34d399', fontFamily: 'var(--sans)', pointerEvents: 'none',
                        fontWeight: 700, letterSpacing: '0.05em',
                      }}
                    >
                      FINANZAS
                    </span>
                  </div>
                </Field>
              )}
            </div>
          </section>

          <Divider />

          {/* ── Sección: Tarifa ── */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={sectionLabelStyle}>Tarifa</p>
            <div className="modal-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <Field
                label="Tarifa unitaria"
                required
                error={touched.tarifa && !num(form.tarifa) ? 'Requerido' : ''}
              >
                <input
                  type="number"
                  value={form.tarifa}
                  onChange={handleTarifaChange}
                  onBlur={(e) => { touch('tarifa')(); onBlur(e); }}
                  onFocus={onFocus}
                  placeholder="0"
                  style={inputStyle}
                />
              </Field>
              <Field label="Margen objetivo %">
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={form.margenObj}
                    onChange={handleMargenChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder="ej: 35"
                    style={inputStyle}
                  />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--sans)', pointerEvents: 'none' }}>
                    → tarifa
                  </span>
                </div>
              </Field>
              <Field label="Descuento %">
                <NumInput value={form.descuento} onChange={set('descuento')} placeholder="0" />
              </Field>
            </div>
          </section>

          {/* ── Resultados en tiempo real ── */}
          <div
            style={{
              background: 'rgba(9,9,16,0.8)',
              border: '1px solid rgba(255,106,185,0.2)',
              borderRadius: '12px',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <p style={{ ...sectionLabelStyle, color: 'var(--accent)' }}>Resultados en tiempo real</p>
            <div
              className="modal-results-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: showGastoEstructura ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)',
                gap: '14px',
              }}
            >
              {resultItems.map(({ label, val, color }) => (
                <div key={label}>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                    {label}
                  </p>
                  <p style={{ fontFamily: 'var(--display)', fontSize: '15px', color, lineHeight: 1 }}>
                    {val}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          {/* ── Estado / Fecha / Observaciones ── */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              className="modal-estado-grid"
              style={{ display: 'grid', gridTemplateColumns: !isNew ? '1fr 1fr' : '1fr', gap: '14px' }}
            >
              <Field label="Estado">
                <select value={form.estado} onChange={set('estado')} style={inputStyle}>
                  <option value="Presupuestado">Presupuestado</option>
                  <option value="Realizado">Realizado</option>
                </select>
              </Field>
              {!isNew && (
                <Field label="Fecha">
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={set('fecha')}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </Field>
              )}
            </div>
            <Field label="Observaciones">
              <textarea
                value={form.observaciones}
                onChange={set('observaciones')}
                placeholder="Notas adicionales..."
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--sans)' }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Field>
          </section>

          {error && (
            <p style={{ fontSize: '12px', color: 'var(--negative)', textAlign: 'center', padding: '8px 12px', background: 'rgba(255,77,109,0.08)', borderRadius: '8px', border: '1px solid rgba(255,77,109,0.2)' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="modal-footer-bar"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px',
            padding: '20px 28px', borderTop: '1px solid rgba(255,106,185,0.15)', flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px', borderRadius: '10px', color: 'var(--text-muted)',
              border: '1px solid rgba(255,106,185,0.2)', background: 'transparent',
              fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,106,185,0.5)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,106,185,0.2)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 28px', borderRadius: '10px',
              background: isValid ? 'linear-gradient(135deg, #FF6AB9, #e040a0)' : 'rgba(255,106,185,0.08)',
              color: isValid ? '#fff' : 'rgba(255,106,185,0.35)',
              border: isValid ? 'none' : '1px solid rgba(255,106,185,0.15)',
              cursor: isValid && !saving ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.03em',
              opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s',
            }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
