import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Pencil,
  Plus,
  Receipt,
  Package,
  Trash2,
  TrendingUp,
  AlertCircle,
  Download,
  Printer,
} from 'lucide-react';
import projectService from '../services/projectService';
import materialService from '../services/materialService';
import expenseService from '../services/expenseService';
import reportService from '../services/reportService';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { STATUS_LABEL, STATUS_TONE } from '../utils/constants';
import './ProjectDetails.css';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="info-row">
      <span className="info-row__icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <span className="info-row__label">{label}</span>
      <span className="info-row__value">{value}</span>
    </div>
  );
}

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [totals, setTotals] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [detail, materialsData, expensesData] = await Promise.all([
        projectService.get(projectId),
        materialService.list(projectId, { limit: 5, sortBy: 'createdAt', order: 'desc' }),
        expenseService.list(projectId, { limit: 5, sortBy: 'expenseDate', order: 'desc' }),
      ]);
      setProject(detail.project);
      setTotals(detail.totals);
      setMaterials(materialsData.items);
      setExpenses(expensesData.items);
    } catch (err) {
      setError(err.message || 'Unable to load project.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectService.remove(projectId);
      toast.success('Project deleted.');
      navigate('/projects');
    } catch (err) {
      toast.error(err.message || 'Failed to delete project.');
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportService.exportProjectSummary(projectId);
      toast.success('Project summary CSV downloaded.');
    } catch (err) {
      toast.error(err.message || 'Failed to export the project summary.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner label="Loading project…" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="page">
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{error || 'Project not found.'}</span>
        </div>
        <Link to="/projects" className="btn btn-secondary mt-4">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title={project.name}
        subtitle={project.description || 'No description provided.'}
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Projects', to: '/projects' },
          { label: project.name },
        ]}
        actions={
          <>
            <Link to={`/projects/${projectId}/report`} className="btn btn-secondary">
              <Printer size={16} aria-hidden="true" />
              PDF Report
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download size={16} aria-hidden="true" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
            <Link to={`/projects/${projectId}/materials`} className="btn btn-primary">
              <Plus size={16} aria-hidden="true" />
              Add Material
            </Link>
            <Link to={`/projects/${projectId}/expenses`} className="btn btn-secondary">
              <Plus size={16} aria-hidden="true" />
              Add Expense
            </Link>
            <Link to={`/projects/${projectId}/edit`} className="btn btn-ghost">
              <Pencil size={16} aria-hidden="true" />
              Edit
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete project"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </>
        }
      />

      <div className="project-tabs" role="tablist">
        <span className="project-tabs__tab is-active">Overview</span>
        <Link to={`/projects/${projectId}/materials`} className="project-tabs__tab">
          Materials
        </Link>
        <Link to={`/projects/${projectId}/expenses`} className="project-tabs__tab">
          Expenses
        </Link>
      </div>

      <div className="project-badges">
        <span className={`badge badge-${STATUS_TONE[project.status] || 'neutral'}`}>
          {STATUS_LABEL[project.status] || project.status}
        </span>
        <span className="badge badge-neutral mono">{project.projectCode}</span>
      </div>

      <div className="stat-grid project-stats">
        <StatCard
          label="Estimated Material Value"
          value={formatCurrency(totals?.estimatedMaterialValue || 0)}
          hint="Estimated value — not money spent"
          icon={TrendingUp}
          tone="warning"
        />
        <StatCard
          label="Recorded Expenses"
          value={formatCurrency(totals?.totalExpenses || 0)}
          hint={`${totals?.expenseCount || 0} expense entr${totals?.expenseCount === 1 ? 'y' : 'ies'}`}
          icon={Receipt}
          tone="danger"
        />
        <StatCard
          label="Material Entries"
          value={totals?.materialCount || 0}
          hint="Project-specific materials"
          icon={Package}
          tone="accent"
        />
      </div>

      <div className="project-grid mt-6">
        <section className="card card-pad">
          <h2 className="card-title mb-4">Project information</h2>
          <div className="info-list">
            <InfoRow icon={MapPin} label="Location" value={project.location || '—'} />
            <InfoRow icon={CalendarDays} label="Start date" value={formatDate(project.startDate)} />
            <InfoRow
              icon={CalendarDays}
              label="Expected completion"
              value={formatDate(project.expectedCompletionDate)}
            />
            <InfoRow
              icon={CalendarDays}
              label="Actual completion"
              value={formatDate(project.actualCompletionDate)}
            />
            <InfoRow
              icon={CalendarDays}
              label="Created"
              value={formatDate(project.createdAt)}
            />
            <InfoRow
              icon={CalendarDays}
              label="Last updated"
              value={formatDate(project.updatedAt)}
            />
          </div>
          {project.notes ? (
            <div className="project-notes">
              <span className="project-notes__label">Notes</span>
              <p>{project.notes}</p>
            </div>
          ) : null}
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Recent materials</h2>
            <Link to={`/projects/${projectId}/materials`} className="btn btn-ghost btn-sm">
              Manage
            </Link>
          </div>
          {materials.length ? (
            <ul className="mini-list">
              {materials.map((m) => (
                <li key={m._id} className="mini-list__item">
                  <div className="mini-list__main">
                    <span className="mini-list__title">{m.name}</span>
                    <span className="mini-list__meta">
                      {m.quantity} {m.unit} × {formatCurrency(m.unitPrice)}
                    </span>
                  </div>
                  <span className="mini-list__value mono">{formatCurrency(m.lineTotal || 0)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Package}
              title="No materials yet"
              description="This project has no materials. Add the first one."
              action={
                <Link to={`/projects/${projectId}/materials`} className="btn btn-primary btn-sm">
                  <Plus size={15} aria-hidden="true" />
                  Add Material
                </Link>
              }
            />
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Recent expenses</h2>
            <Link to={`/projects/${projectId}/expenses`} className="btn btn-ghost btn-sm">
              Manage
            </Link>
          </div>
          {expenses.length ? (
            <ul className="mini-list">
              {expenses.map((e) => (
                <li key={e._id} className="mini-list__item">
                  <div className="mini-list__main">
                    <span className="mini-list__title">{e.title}</span>
                    <span className="mini-list__meta">{formatDate(e.expenseDate)}</span>
                  </div>
                  <span className="mini-list__value mono">{formatCurrency(e.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Receipt}
              title="No expenses recorded"
              description="Record actual expenses for this project."
              action={
                <Link to={`/projects/${projectId}/expenses`} className="btn btn-primary btn-sm">
                  <Plus size={15} aria-hidden="true" />
                  Add Expense
                </Link>
              }
            />
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete project?"
        message={`Deleting “${project.name}” will permanently remove the project and all of its materials and expenses. This cannot be undone.`}
        confirmLabel="Delete project"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </div>
  );
}
