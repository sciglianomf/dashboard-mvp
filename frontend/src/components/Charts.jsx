import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, LabelList,
} from 'recharts';
import { formatARS } from '../utils/format';
import { useIsMobile } from '../hooks/useIsMobile';

const AREA_COLORS = {
  Creatividad: '#FF6AB9',
  Producción:  '#63b3ed',
  Trade:       '#f97316',
  Finanzas:    '#34d399',
  Comercial:   '#a78bfa',
};

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

// ─── Tooltip Ganancia Neta ─────────────────────────────────────────────────────
function GananciaTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const color = AREA_COLORS[d.area] || 'var(--accent)';
  return (
    <div style={{ background: 'var(--bg-surface)', border: `1px solid ${color}44`, borderRadius: '10px', padding: '14px 18px', fontFamily: 'var(--sans)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', minWidth: '190px' }}>
      <p style={{ color, fontWeight: 700, fontSize: '13px', marginBottom: '10px', letterSpacing: '0.04em' }}>{d.area}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <Row label="Tarifa"           val={d.tarifa}        color="var(--text-secondary)" />
        <Row label="Producción"       val={-d.totalProd}    color="var(--text-muted)" neg />
        <Row label="Gasto Estructura" val={-d.gastoEstructura} color="#ff4d6d" neg />
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
        <Row label="Ganancia Neta"    val={d.gananciaNeta}  color={d.gananciaNeta >= 0 ? color : '#ff4d6d'} bold />
      </div>
    </div>
  );
}

function Row({ label, val, color, neg, bold }) {
  const fmtVal = neg
    ? (val === 0 ? formatARS(0) : `−${formatARS(Math.abs(val))}`)
    : formatARS(val);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: '11px', color, fontWeight: bold ? 700 : 400 }}>{fmtVal}</span>
    </div>
  );
}

// ─── GananciaNetaChart ─────────────────────────────────────────────────────────
export function GananciaNetaChart({ data }) {
  const isMobile = useIsMobile();

  const chartData = (data || []).map((d) => ({
    ...d,
    barColor: d.gananciaNeta >= 0 ? (AREA_COLORS[d.area] || '#FF6AB9') : '#ff4d6d',
  }));

  const hasAnyData = chartData.some((d) => d.tarifa > 0);

  // Formateador corto para eje Y
  const yFmt = (v) => {
    const abs = Math.abs(v);
    if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
    if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
    return `${v}`;
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '12px', padding: isMobile ? '16px' : '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: isMobile ? '14px' : '20px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Ganancia neta por área
          </p>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '11px', marginTop: '3px', opacity: 0.6 }}>
            Tarifa − Producción − Gasto de Estructura
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {Object.entries(AREA_COLORS).map(([area, color]) => (
            <div key={area} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '2px', background: color }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>{area}</span>
            </div>
          ))}
        </div>
      </div>

      {!hasAnyData ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '13px' }}>Sin datos para el período seleccionado</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
          <BarChart data={chartData} margin={{ top: 28, right: 16, left: 10, bottom: 4 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="area"
              tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'var(--sans)', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={yFmt}
              tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<GananciaTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
            <Bar dataKey="gananciaNeta" radius={[4, 4, 0, 0]} maxBarSize={72}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.barColor} fillOpacity={0.85} />
              ))}
              <LabelList
                dataKey="gananciaNeta"
                position="top"
                formatter={(v) => {
                  const abs = Math.abs(v);
                  const sign = v < 0 ? '−' : '';
                  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
                  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
                  return `${sign}$${abs}`;
                }}
                style={{ fontSize: 11, fontFamily: 'var(--sans)', fontWeight: 700, fill: 'var(--text-secondary)' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

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
