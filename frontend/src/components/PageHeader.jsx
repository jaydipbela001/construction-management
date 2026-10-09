import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './PageHeader.css';

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  return (
    <div className="page-header">
      {breadcrumbs.length > 0 ? (
        <nav className="page-header__breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={`${crumb.label}-${index}`} className="page-header__crumb">
                {crumb.to && !isLast ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined}>{crumb.label}</span>
                )}
                {!isLast ? <ChevronRight size={14} aria-hidden="true" /> : null}
              </span>
            );
          })}
        </nav>
      ) : null}

      <div className="page-header__row">
        <div className="page-header__text">
          <h1 className="page-header__title">{title}</h1>
          {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
