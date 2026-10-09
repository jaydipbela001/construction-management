import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  FolderKanban,
  Package,
  Receipt,
  TrendingUp,
  Plus,
  AlertCircle,
} from 'lucide-react';
import dashboardService from '../services/dashboardService';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { STATUS_LABEL, STATUS_TONE } from '../utils/constants';
import './Dashboard.css';

function StatusBadge({ status }) {
  return <span className={`badge badge-${STATUS_TONE[status] || 'neutral'}`}>{STATUS_LABEL[status] || status}</span>;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const summary = await dashboardService.summary();
        if (active) setData(summary);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const stats = data?.stats;

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        subtitle="A live overview of your construction projects, materials, and expenses."
        actions={
          <Link to="/projects/new" className="btn btn-primary">
            <Plus size={16} aria-hidden="true" />
            New Project
          </Link>
        }
      />

      {error ? (
        <div className="alert alert-error mb-6" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="stat-grid">
        <StatCard
          label="Total Projects"
          value={stats ? stats.totalProjects : '—'}
          icon={FolderKanban}
          tone="accent"
          loading={loading}
        />
        <StatCard
          label="Active Projects"
          value={stats ? stats.activeProjects : '—'}
          icon={Activity}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Completed Projects"
          value={stats ? stats.completedProjects : '—'}
          icon={CheckCircle2}
          tone="info"
          loading={loading}
        />
        <StatCard
          label="Material Entries"
          value={stats ? stats.totalMaterialEntries : '—'}
          hint="Across all projects"
          icon={Package}
          loading={loading}
        />
        <StatCard
          label="Estimated Material Value"
          value={stats ? formatCurrency(stats.totalEstimatedMaterialValue) : '—'}
          hint="Estimated value — not money spent"
          icon={TrendingUp}
          tone="warning"
          loading={loading}
        />
        <StatCard
          label="Recorded Expenses"
          value={stats ? formatCurrency(stats.totalRecordedExpenses) : '—'}
          hint="Actual expenses recorded"
          icon={Receipt}
          tone="danger"
          loading={loading}
        />
      </div>

      {loading && !data ? (
        <div className="card mt-6">
          <LoadingSpinner label="Loading dashboard…" />
        </div>
      ) : (
        <div className="dashboard-grid mt-6">
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Projects</h2>
              <Link to="/projects" className="btn btn-ghost btn-sm">
                View all
              </Link>
            </div>
            {data?.recentProjects?.length ? (
              <ul className="dashboard-list">
                {data.recentProjects.map((project) => (
                  <li key={project._id} className="dashboard-list__item">
                    <Link to={`/projects/${project._id}`} className="dashboard-list__main">
                      <span className="dashboard-list__title">{project.name}</span>
                      <span className="dashboard-list__meta">
                        <span className="mono">{project.projectCode}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDate(project.createdAt)}</span>
                      </span>
                    </Link>
                    <StatusBadge status={project.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Create your first construction project to get started."
                action={
                  <Link to="/projects/new" className="btn btn-primary btn-sm">
                    <Plus size={15} aria-hidden="true" />
                    New Project
                  </Link>
                }
              />
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Materials</h2>
            </div>
            {data?.recentMaterials?.length ? (
              <ul className="dashboard-list">
                {data.recentMaterials.map((material) => (
                  <li key={material._id} className="dashboard-list__item">
                    <div className="dashboard-list__main">
                      <span className="dashboard-list__title">{material.name}</span>
                      <span className="dashboard-list__meta">
                        <span>{material.projectId?.name || 'Unknown project'}</span>
                      </span>
                    </div>
                    <span className="dashboard-list__value mono">
                      {formatCurrency(material.lineTotal || 0)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Package}
                title="No materials yet"
                description="Add materials from a project's workspace."
              />
            )}
          </section>

          <section className="card dashboard-grid__wide">
            <div className="card-header">
              <h2 className="card-title">Recent Expenses</h2>
            </div>
            {data?.recentExpenses?.length ? (
              <ul className="dashboard-list">
                {data.recentExpenses.map((expense) => (
                  <li key={expense._id} className="dashboard-list__item">
                    <div className="dashboard-list__main">
                      <span className="dashboard-list__title">{expense.title}</span>
                      <span className="dashboard-list__meta">
                        <span>{expense.projectId?.name || 'Unknown project'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDate(expense.expenseDate)}</span>
                      </span>
                    </div>
                    <span className="dashboard-list__value mono">
                      {formatCurrency(expense.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Receipt}
                title="No expenses recorded"
                description="Record actual expenses from a project's expense page."
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
