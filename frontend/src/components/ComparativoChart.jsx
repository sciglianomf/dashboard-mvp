import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatARS } from '../utils/format';

export default function ComparativoChart({ data }) {
  if (!data) return null;

  const { añoActual, añoAnterior, actual, anterior } = data;

  const chartData = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({
    trimestre: q,
    [añoActual]: actual[q] || 0,
    [añoAnterior]: anterior[q] || 0,
  }));

  const containerStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '24px',
  };

  const titleStyle = {
    fontFamily: 'var(--sans)',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '16px',
  };

  return (
    <div style={containerStyle}>
      <p style={titleStyle}>Comparativo anual — {añoAnterior} vs {añoActual}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 24, left: 10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="trimestre" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => v === 0 ? '0' : `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value, name) => [formatARS(value), name]}
            contentStyle={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,106,185,0.25)', borderRadius: '10px', padding: '12px 16px', fontFamily: 'var(--sans)', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', minWidth: '140px' }}
            labelStyle={{ color: 'var(--accent)', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}
            cursor={{ fill: 'rgba(255,106,185,0.06)', rx: 4 }}
          />
          <Legend wrapperStyle={{ fontFamily: 'var(--sans)', fontSize: '11px', paddingTop: '8px' }} />
          <Bar dataKey={String(añoAnterior)} fill="rgba(255,106,185,0.3)" radius={[4,4,0,0]} />
          <Bar dataKey={String(añoActual)} fill="var(--accent)" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
