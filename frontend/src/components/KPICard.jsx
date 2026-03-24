export default function KPICard({ title, value, subtitle, accent = false }) {
  return (
    <div
      className="relative rounded-xl p-5 transition-all duration-300 group cursor-default"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 0 24px rgba(0,212,255,0.10), 0 1px 3px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = 'rgba(0,212,255,0.35)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Cyan top accent line */}
      <div
        className="absolute top-0 left-4 right-4 h-px rounded-full"
        style={{ background: accent ? 'var(--accent)' : 'rgba(0,212,255,0.4)' }}
      />

      <p
        className="text-xs uppercase tracking-widest mb-3 font-medium"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}
      >
        {title}
      </p>

      <p
        className="text-3xl font-bold leading-none mb-2 tracking-tight"
        style={{
          fontFamily: 'var(--mono)',
          color: accent ? 'var(--accent)' : 'var(--text-primary)',
        }}
      >
        {value}
      </p>

      {subtitle && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
