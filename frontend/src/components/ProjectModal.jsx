import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatARS, formatPct } from '../utils/format';

const ELEMENTOS_OPCIONES = [
  'Cartel', 'Banner', 'Lona', 'Placa PAI', 'Rollup',
  'Vinilo', 'Display', 'Backdrop', 'Bandera', 'Señalética',
];

const EMPTY = {
  cliente: '', campaña: '', elemento: '', formato: '',
  costoInn: '', costoPlacaPai: '', costoLona: '', ws: '', confiPct: '',
  tarifa: '', observaciones: '', situacion: '', estado: 'Presupuestado', año: new Date().getFullYear(),
};

function FieldGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs uppercase tracking-widest"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const labelStyle = {
  color: 'var(--text-muted)',
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  display: 'block',
  marginBottom: '4px',
};

const inputStyle = {
  background: 'var(--bg-base)',
  border: '1px solid rgba(0,212,255,0.2)',
  borderRadius: '8px',
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  fontFamily: 'var(--mono)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s',
};

function Input({ value, onChange, type = 'text', placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
    />
  );
}

export default function ProjectModal({ project, onClose, onSaved }) {
  const isNew = !project?.id || project.source === undefined;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setForm({
        cliente: project.cliente || '',
        campaña: project.campaña || '',
        elemento: project.elemento || '',
        formato: project.formato || '',
        costoInn: project.costoInn ?? '',
        costoPlacaPai: project.costoPlacaPai ?? '',
        costoLona: project.costoLona ?? '',
        ws: project.ws ?? '',
        confiPct: project.confiPct ?? '',
        tarifa: project.tarifa ?? '',
        observaciones: project.observaciones || '',
        situacion: project.situacion || '',
        estado: project?.estado || 'Presupuestado',
        año: project.año || new Date().getFullYear(),
      });
    }
  }, [project]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const num = (v) => parseFloat(v) || 0;
  const totalProd = num(form.costoInn) + num(form.costoPlacaPai) + num(form.costoLona) + num(form.ws) + num(form.confiPct);
  const margenAbs = num(form.tarifa) - totalProd;
  const margenPct = num(form.tarifa) > 0 ? margenAbs / num(form.tarifa) : 0;

  const isValid = form.cliente.trim() !== '' && num(form.tarifa) > 0;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        costoInn: num(form.costoInn),
        costoPlacaPai: num(form.costoPlacaPai),
        costoLona: num(form.costoLona),
        ws: num(form.ws),
        confiPct: num(form.confiPct),
        tarifa: num(form.tarifa),
        año: parseInt(form.año),
        sheet: project?.sheet || form.campaña || 'Local',
      };
      if (isNew || !project?.id) {
        await api.post('/api/projects', payload);
      } else {
        await api.put(`/api/projects/${project.id}`, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          maxHeight: '90vh',
          boxShadow: '0 0 60px rgba(0,212,255,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <p
            className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
          >
            {isNew ? '+ Nuevo Proyecto' : 'Editar Proyecto'}
          </p>
          <button
            onClick={onClose}
            className="text-lg leading-none transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.target.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.target.style.color = 'var(--text-muted)')}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Cliente *">
              <Input value={form.cliente} onChange={set('cliente')} placeholder="Ej: Disney" />
              {!form.cliente.trim() && <p className="text-xs" style={{ color: 'var(--negative)' }}>Requerido</p>}
            </FieldGroup>
            <FieldGroup label="Campaña">
              <Input value={form.campaña} onChange={set('campaña')} placeholder="Ej: Mandalorian" />
            </FieldGroup>
            <FieldGroup label="Elemento">
              <input
                list="elementos-opciones"
                value={form.elemento}
                onChange={e => setForm(f => ({ ...f, elemento: e.target.value }))}
                placeholder="Seleccioná o escribí un elemento"
                style={inputStyle}
              />
              <datalist id="elementos-opciones">
                {ELEMENTOS_OPCIONES.map(opt => <option key={opt} value={opt} />)}
              </datalist>
            </FieldGroup>
            <FieldGroup label="Formato">
              <Input value={form.formato} onChange={set('formato')} placeholder="Ej: Mupi" />
            </FieldGroup>
          </div>

          <div
            className="h-px"
            style={{ background: 'var(--border-subtle)' }}
          />

          <p
            className="text-xs uppercase tracking-widest"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}
          >
            Costos (ARS)
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              ['Costo Inn.', 'costoInn'],
              ['Costo Placa PAI', 'costoPlacaPai'],
              ['Costo Lona', 'costoLona'],
              ['WS', 'ws'],
              ['Confi $', 'confiPct'],
              ['Tarifa *', 'tarifa'],
            ].map(([label, key]) => (
              <FieldGroup key={key} label={label}>
                <Input
                  type="number"
                  value={form[key]}
                  onChange={set(key)}
                  placeholder="0"
                />
              </FieldGroup>
            ))}
          </div>

          {/* Calculated preview */}
          <div
            className="rounded-xl p-4 grid grid-cols-3 gap-3"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
          >
            {[
              ['Total Prod.', formatARS(totalProd), 'var(--text-primary)'],
              ['Margen ARS', formatARS(margenAbs), margenAbs >= 0 ? 'var(--positive)' : 'var(--negative)'],
              ['Margen %', formatPct(margenPct), margenPct >= 0.3 ? 'var(--positive)' : margenPct >= 0 ? '#F59E0B' : 'var(--negative)'],
            ].map(([label, val, color]) => (
              <div key={label}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{label}</p>
                <p className="text-base font-bold" style={{ color, fontFamily: 'var(--mono)' }}>{val}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Situación">
              <Input value={form.situacion} onChange={set('situacion')} placeholder="Ej: En producción" />
            </FieldGroup>
            <FieldGroup label="Año">
              <Input type="number" value={form.año} onChange={set('año')} />
            </FieldGroup>
          </div>

          <div>
            <label style={labelStyle}>Estado</label>
            <select
              value={form.estado}
              onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
              style={inputStyle}
            >
              <option value="Presupuestado">Presupuestado</option>
              <option value="Realizado">Realizado</option>
            </select>
          </div>

          <FieldGroup label="Observaciones">
            <textarea
              value={form.observaciones}
              onChange={set('observaciones')}
              placeholder="Notas adicionales..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--sans)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
            />
          </FieldGroup>

          {error && (
            <p className="text-xs text-center" style={{ color: 'var(--negative)' }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              color: 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
            }}
            onMouseEnter={e => (e.target.style.borderColor = 'rgba(255,255,255,0.2)')}
            onMouseLeave={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: isValid ? 'var(--accent)' : 'rgba(0,212,255,0.2)',
              color: isValid ? '#080C10' : 'var(--text-muted)',
              cursor: isValid ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--mono)',
            }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
