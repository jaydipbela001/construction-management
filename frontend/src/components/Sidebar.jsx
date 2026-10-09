import { NavLink } from 'react-router-dom';
import { HardHat, LayoutDashboard, FolderKanban, Users, LogOut, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admins', label: 'Admins', icon: Users },
];

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { admin, logout } = useAuth();

  return (
    <aside
      className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`}
    >
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          <HardHat size={22} />
        </span>
        <span className="sidebar__brand-text">
          Build<span>Track</span>
        </span>
        <button
          type="button"
          className="sidebar__close icon-btn"
          onClick={onCloseMobile}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Primary">
        <span className="sidebar__section-label">Menu</span>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={19} aria-hidden="true" />
              <span className="sidebar__link-text">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__admin">
          <span className="sidebar__avatar" aria-hidden="true">
            {(admin?.name || admin?.email || 'A').charAt(0).toUpperCase()}
          </span>
          <span className="sidebar__admin-meta">
            <span className="sidebar__admin-name">{admin?.name || 'Administrator'}</span>
            <span className="sidebar__admin-email">{admin?.email}</span>
          </span>
        </div>
        <button
          type="button"
          className="sidebar__logout"
          onClick={logout}
          title={collapsed ? 'Log out' : undefined}
        >
          <LogOut size={18} aria-hidden="true" />
          <span className="sidebar__link-text">Log out</span>
        </button>
      </div>
    </aside>
  );
}
