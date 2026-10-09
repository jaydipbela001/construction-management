import { Link } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__card">
        <span className="not-found__icon" aria-hidden="true">
          <HardHat size={30} />
        </span>
        <span className="not-found__code">404</span>
        <h1 className="not-found__title">Page not found</h1>
        <p className="not-found__text">
          The page you are looking for doesn’t exist or may have been moved.
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
