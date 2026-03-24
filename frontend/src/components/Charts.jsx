import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { formatARS } from '../utils/format';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg p-3 text-xs"
      style={{
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border)',
        fontFamily: 'var(--mono)',
        color: 'var(--text-primary)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <p className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.name === 'Margen' ? 'var(--positive)' : 'var(--accent)' }}>
          {entry.name}: {formatARS(entry.value)}
        </p>
      ))}
    </div>
  );
}

const CYAN_SHADES = [
  '#00D4FF', '#00BFEA', '#00AAD5', '#0095C0', '#0080AB',
  '#006B96', '#005681', '#00416C', '#002C57', '#001742',
];

export function ClientesChart({ data }) {
  const chartData = (data || [])
    .filter(c => c.cliente !== 'Sin cliente')
    .slice(0, 8)
    .map(c => ({
      name: c.cliente.length > 20 ? c.cliente.slice(0, 20) + '…' : c.cliente,
      Tarifa: c.tarifa,
      Margen: c.margen,
    }));

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <p
        className="text-xs uppercase tracking-widest font-medium mb-5"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}
      >
        Facturación por Cliente
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 60 }} barGap={2}>
          <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#4A6080', fontFamily: 'var(--mono)' }}
            angle={-40}
            textAnchor="end"
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `$${(v/1e6).toFixed(0)}M`}
            tick={{ fontSize: 10, fill: '#4A6080', fontFamily: 'var(--mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,212,255,0.04)' }} />
          <Bar dataKey="Tarifa" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="Margen" fill="var(--positive)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CampañasChart({ data }) {
  const chartData = (data || []).slice(0, 10).map((c, i) => ({
    name: c.campaña.length > 18 ? c.campaña.slice(0, 18) + '…' : c.campaña,
    Tarifa: c.tarifa,
    color: CYAN_SHADES[i % CYAN_SHADES.length],
  }));

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <p
        className="text-xs uppercase tracking-widest font-medium mb-5"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}
      >
        Top Campañas
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={v => `$${(v/1e6).toFixed(0)}M`}
            tick={{ fontSize: 10, fill: '#4A6080', fontFamily: 'var(--mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10, fill: '#4A6080', fontFamily: 'var(--mono)' }}
            width={120}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,212,255,0.04)' }} />
          <Bar dataKey="Tarifa" radius={[0, 3, 3, 0]} maxBarSize={18}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
