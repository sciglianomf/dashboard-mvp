import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { formatARS } from '../utils/format';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(255,106,185,0.25)',
        borderRadius: '10px',
        padding: '12px 16px',
        fontFamily: 'var(--sans)',
        color: 'var(--text-primary)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        minWidth: '140px',
      }}
    >
      <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.name === 'Margen' ? 'var(--positive)' : 'var(--accent)', fontSize: '12px', marginBottom: i < payload.length - 1 ? '4px' : 0 }}>
          {entry.name}: {formatARS(entry.value)}
        </p>
      ))}
    </div>
  );
}

const PINK_SHADES = [
  '#FF6AB9', '#F05EAA', '#E0529B', '#D0468C', '#C03A7D',
  '#B02E6E', '#A0225F', '#901650', '#800A41', '#700032',
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
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>
        Facturación por Cliente
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 20, left: 10, bottom: 60 }} barGap={2}>
          <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }}
            angle={-40}
            textAnchor="end"
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `$${(v/1e6).toFixed(0)}M`}
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,106,185,0.04)' }} />
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
    color: PINK_SHADES[i % PINK_SHADES.length],
  }));

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>
        Top Campañas
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 28, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={v => `$${(v/1e6).toFixed(0)}M`}
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }}
            width={120}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,106,185,0.04)' }} />
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
