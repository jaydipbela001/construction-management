import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Plus, Search, Trash2, FolderKanban, AlertCircle } from 'lucide-react';
import projectService from '../services/projectService';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { formatDate } from '../utils/date';
import { PROJECT_STATUSES, STATUS_LABEL, STATUS_TONE, PAGE_SIZE } from '../utils/constants';
import './Projects.css';

export default function Projects() {
  const navigate = useNavigate();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await projectService.list({
        search: debouncedSearch || undefined,
        status: status || undefined,
        sortBy,
        order,
        page,
        limit: PAGE_SIZE,
      });
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, sortBy, order, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sortBy, order]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await projectService.remove(deleteTarget._id);
      toast.success(`Project “${deleteTarget.name}” deleted.`);
      setDeleteTarget(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchProjects();
    } catch (err) {
      toast.error(err.message || 'Failed to delete project.');
    } finally {
      setDeleting(false);
    }
  };

  const renderActions = (row) => (
    <div className="cell-actions">
      <button
        type="button"
        className="icon-btn"
        title="View project"
        aria-label={`View ${row.name}`}
        onClick={() => navigate(`/projects/${row._id}`)}
      >
        <Eye size={16} />
      </button>
      <button
        type="button"
        className="icon-btn"
        title="Edit project"
        aria-label={`Edit ${row.name}`}
        onClick={() => navigate(`/projects/${row._id}/edit`)}
      >
        <Pencil size={16} />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn--danger"
        title="Delete project"
        aria-label={`Delete ${row.name}`}
        onClick={() => setDeleteTarget(row)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  const renderProjectCard = (row) => (
    <div className="project-card">
      <div className="project-card__head">
        <div className="project-cell">
          <Link to={`/projects/${row._id}`} className="project-cell__name">
            {row.name}
          </Link>
          <span className="project-cell__code mono">{row.projectCode}</span>
        </div>
        {renderActions(row)}
      </div>
      <div className="project-card__grid">
        <div className="project-card__stat">
          <span className="project-card__label">Status</span>
          <span className={`badge badge-${STATUS_TONE[row.status] || 'neutral'}`}>
            {STATUS_LABEL[row.status] || row.status}
          </span>
        </div>
        <div className="project-card__stat">
          <span className="project-card__label">Location</span>
          <span>{row.location || '—'}</span>
        </div>
        <div className="project-card__stat">
          <span className="project-card__label">Start date</span>
          <span>{formatDate(row.startDate)}</span>
        </div>
        <div className="project-card__stat">
          <span className="project-card__label">Created</span>
          <span>{formatDate(row.createdAt)}</span>
        </div>
      </div>
    </div>
  );

  const columns = [
    {
      key: 'name',
      header: 'Project',
      render: (row) => (
        <div className="project-cell">
          <Link to={`/projects/${row._id}`} className="project-cell__name">
            {row.name}
          </Link>
          <span className="project-cell__code mono">{row.projectCode}</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => row.location || <span className="text-secondary">—</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`badge badge-${STATUS_TONE[row.status] || 'neutral'}`}>
          {STATUS_LABEL[row.status] || row.status}
        </span>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (row) => formatDate(row.startDate),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: renderActions,
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Construction Projects"
        subtitle="Create and manage independent construction projects."
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Projects' }]}
        actions={
          <Link to="/projects/new" className="btn btn-primary">
            <Plus size={16} aria-hidden="true" />
            New Construction Project
          </Link>
        }
      />

      <div className="card">
        <div className="toolbar">
          <div className="toolbar__search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              className="form-control"
              placeholder="Search by project name or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search projects"
            />
          </div>

          <select
            className="form-control toolbar__control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            className="form-control toolbar__control"
            value={`${sortBy}:${order}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split(':');
              setSortBy(field);
              setOrder(dir);
            }}
            aria-label="Sort projects"
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="name:asc">Name (A–Z)</option>
            <option value="name:desc">Name (Z–A)</option>
            <option value="startDate:desc">Start date (newest)</option>
            <option value="startDate:asc">Start date (oldest)</option>
            <option value="status:asc">Status</option>
          </select>
        </div>

        {error ? (
          <div className="alert alert-error toolbar-alert" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          ariaLabel="Projects"
          renderMobileCard={renderProjectCard}
          empty={
            <EmptyState
              icon={FolderKanban}
              title={debouncedSearch || status ? 'No matching projects' : 'No projects yet'}
              description={
                debouncedSearch || status
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first construction project to begin managing materials and expenses.'
              }
              action={
                !debouncedSearch && !status ? (
                  <Link to="/projects/new" className="btn btn-primary btn-sm">
                    <Plus size={15} aria-hidden="true" />
                    New Construction Project
                  </Link>
                ) : null
              }
            />
          }
        />

        {!loading && items.length > 0 ? (
          <div className="pagination">
            <span className="pagination-info">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} project
              {pagination.total === 1 ? '' : 's'}
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete project?"
        message={
          deleteTarget
            ? `Deleting “${deleteTarget.name}” will permanently remove the project and all of its materials and expenses. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete project"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
