import './LoadingSpinner.css';

export default function LoadingSpinner({ size = 28, label, className = '' }) {
  return (
    <div className={`loading-spinner ${className}`.trim()}>
      <span
        className="spinner"
        style={{ width: size, height: size, borderWidth: Math.max(2, size / 10) }}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label ? <span className="loading-spinner__label">{label}</span> : null}
    </div>
  );
}
