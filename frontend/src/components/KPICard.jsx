export default function KPICard({ title, value, subtitle, accent = false }) {
  return (
    <div
      className="relative rounded-xl p-5 transition-all duration-300 group cursor-default overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,106,185,0.13) 0%, rgba(9,9,16,0.95) 100%)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 0 24px rgba(255,106,185,0.12), 0 1px 3px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = 'rgba(255,106,185,0.35)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Decorative orb */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: 65, height: 65,
        background: 'rgba(255,106,185,0.12)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      <p
        className="text-xs uppercase tracking-widest mb-3"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '11px' }}
      >
        {title}
      </p>

      <p
        className="leading-none mb-2 tracking-tight"
        style={{
          fontFamily: 'var(--display)',
          fontSize: '30px',
          color: accent ? 'var(--accent)' : 'var(--text-primary)',
        }}
      >
        {value}
      </p>

      {subtitle && (
        <p style={{ color: '#FF6AB9', fontFamily: 'var(--sans)', fontSize: '12px', fontWeight: 300 }}>
          {subtitle}
        </p>
      )}

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 2,
        background: 'linear-gradient(90deg, #FF6AB9, transparent)',
        borderRadius: '0 0 12px 12px',
      }} />
    </div>
  );
}
