import './StatCard.css';

export default function StatCard({ label, value, hint, icon: Icon, tone = 'default', loading = false }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__head">
        <span className="stat-card__label">{label}</span>
        {Icon ? (
          <span className="stat-card__icon" aria-hidden="true">
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      <div className="stat-card__value">
        {loading ? <span className="stat-card__skeleton" /> : value}
      </div>
      {hint ? <div className="stat-card__hint">{hint}</div> : null}
    </div>
  );
}
