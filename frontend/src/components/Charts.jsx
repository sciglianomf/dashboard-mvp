import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { formatARS } from '../utils/format';
import { useIsMobile } from '../hooks/useIsMobile';

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
  const isMobile = useIsMobile();
  const maxItems = isMobile ? 6 : 8;
  const maxLabelLen = isMobile ? 12 : 20;

  const chartData = (data || [])
    .filter(c => c.cliente !== 'Sin cliente')
    .slice(0, maxItems)
    .map(c => ({
      name: c.cliente.length > maxLabelLen ? c.cliente.slice(0, maxLabelLen) + '…' : c.cliente,
      Tarifa: c.tarifa,
      Margen: c.margen,
    }));

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: isMobile ? '16px' : '24px' }}>
      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: isMobile ? '12px' : '20px' }}>
        Facturación por Cliente
      </p>
      <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
        <BarChart data={chartData} margin={{ top: 4, right: 12, left: isMobile ? 0 : 10, bottom: isMobile ? 48 : 60 }} barGap={2}>
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
  const isMobile = useIsMobile();
  const maxItems = isMobile ? 7 : 10;
  const maxLabelLen = isMobile ? 12 : 18;
  const yAxisWidth = isMobile ? 80 : 110;

  const chartData = (data || []).slice(0, maxItems).map((c, i) => ({
    name: c.campaña.length > maxLabelLen ? c.campaña.slice(0, maxLabelLen) + '…' : c.campaña,
    Tarifa: c.tarifa,
    color: PINK_SHADES[i % PINK_SHADES.length],
  }));

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: isMobile ? '16px' : '24px' }}>
      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: isMobile ? '12px' : '20px' }}>
        Top Campañas
      </p>
      <ResponsiveContainer width="100%" height={isMobile ? 210 : 260}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: isMobile ? 16 : 28, left: 0, bottom: 4 }}>
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
            width={yAxisWidth}
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
