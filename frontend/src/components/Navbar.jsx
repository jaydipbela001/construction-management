import { Link } from 'react-router-dom';
import { Menu, PanelLeft, Plus } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ collapsed, onToggleCollapse, onOpenMobile }) {
  return (
    <header className="navbar">
      <button
        type="button"
        className="navbar__menu icon-btn"
        onClick={onOpenMobile}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <button
        type="button"
        className="navbar__collapse icon-btn"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <PanelLeft size={20} />
      </button>

      <div className="navbar__spacer" />

      <Link to="/projects/new" className="btn btn-primary btn-sm navbar__action">
        <Plus size={16} aria-hidden="true" />
        <span>New Project</span>
      </Link>
    </header>
  );
}
