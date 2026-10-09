import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Plus,
  Search,
  Trash2,
  Receipt,
  AlertCircle,
  Save,
} from 'lucide-react';
import expenseService from '../services/expenseService';
import projectService from '../services/projectService';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/currency';
import { formatDate, toDateInputValue } from '../utils/date';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, PAGE_SIZE } from '../utils/constants';
import './Expenses.css';

const EMPTY_EXPENSE = {
  title: '',
  category: 'miscellaneous',
  amount: '',
  expenseDate: toDateInputValue(new Date()),
  paymentMethod: '',
  payee: '',
  notes: '',
};

function prettyLabel(value) {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function ExpenseForm({ initial, projectId, onSaved, onCancel, notify }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY_EXPENSE;
    return {
      title: initial.title || '',
      category: initial.category || 'miscellaneous',
      amount: initial.amount ?? '',
      expenseDate: toDateInputValue(initial.expenseDate),
      paymentMethod: initial.paymentMethod || '',
      payee: initial.payee || '',
      notes: initial.notes || '',
    };
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Expense title is required';
    const amount = Number(form.amount);
    if (form.amount === '' || Number.isNaN(amount)) next.amount = 'Amount must be a number';
    else if (amount < 0) next.amount = 'Amount cannot be negative';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount),
      expenseDate: form.expenseDate || null,
      paymentMethod: form.paymentMethod,
      payee: form.payee.trim(),
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await expenseService.update(projectId, initial._id, payload);
        notify.success('Expense updated.');
      } else {
        await expenseService.create(projectId, payload);
        notify.success('Expense recorded.');
      }
      onSaved();
    } catch (err) {
      setServerError(err.message || 'Unable to save expense.');
      if (err.errors) setErrors(err.errors);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      {serverError ? (
        <div className="alert alert-error mb-4" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      ) : null}

      <div className="form-grid">
        <div className="form-group span-2">
          <label className="form-label" htmlFor="e-title">
            Expense title<span className="required">*</span>
          </label>
          <input
            id="e-title"
            className={`form-control ${errors.title ? 'is-invalid' : ''}`}
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. Foundation labor payment"
            disabled={saving}
          />
          {errors.title ? <span className="form-error">{errors.title}</span> : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="e-amount">
            Amount<span className="required">*</span>
          </label>
          <input
            id="e-amount"
            type="number"
            min="0"
            step="any"
            className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
            value={form.amount}
            onChange={(e) => setField('amount', e.target.value)}
            placeholder="0.00"
            disabled={saving}
          />
          {errors.amount ? <span className="form-error">{errors.amount}</span> : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="e-date">
            Expense date
          </label>
          <input
            id="e-date"
            type="date"
            className="form-control"
            value={form.expenseDate}
            onChange={(e) => setField('expenseDate', e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="e-category">
            Category
          </label>
          <select
            id="e-category"
            className="form-control"
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            disabled={saving}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {prettyLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="e-payment">
            Payment method
          </label>
          <select
            id="e-payment"
            className="form-control"
            value={form.paymentMethod}
            onChange={(e) => setField('paymentMethod', e.target.value)}
            disabled={saving}
          >
            <option value="">Not specified</option>
            {PAYMENT_METHODS.map((p) => (
              <option key={p} value={p}>
                {prettyLabel(p)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group span-2">
          <label className="form-label" htmlFor="e-payee">
            Supplier / payee
          </label>
          <input
            id="e-payee"
            className="form-control"
            value={form.payee}
            onChange={(e) => setField('payee', e.target.value)}
            placeholder="Optional"
            disabled={saving}
          />
        </div>

        <div className="form-group span-2">
          <label className="form-label" htmlFor="e-notes">
            Notes
          </label>
          <textarea
            id="e-notes"
            className="form-control"
            rows={2}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Optional"
            disabled={saving}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save size={16} aria-hidden="true" />
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Record expense'}
        </button>
      </div>
    </form>
  );
}

export default function Expenses() {
  const { projectId } = useParams();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('expenseDate:desc');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ totalExpenses: 0, expenseCount: 0 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    projectService
      .get(projectId)
      .then(({ project: p }) => {
        if (active) setProject(p);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [projectId]);

  const [sortBy, order] = sort.split(':');

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await expenseService.list(projectId, {
        search: debouncedSearch || undefined,
        category: category || undefined,
        from: from || undefined,
        to: to || undefined,
        sortBy,
        order,
        page,
        limit: PAGE_SIZE,
      });
      setItems(data.items);
      setSummary(data.summary);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || 'Unable to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [projectId, debouncedSearch, category, from, to, sortBy, order, page]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, from, to, sort]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (expense) => {
    setEditing(expense);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };
  const handleSaved = () => {
    closeModal();
    fetchExpenses();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await expenseService.remove(projectId, deleteTarget._id);
      toast.success('Expense deleted.');
      setDeleteTarget(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchExpenses();
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense.');
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setFrom('');
    setTo('');
  };

  const hasFilters = Boolean(search || category || from || to);

  const renderActions = (row) => (
    <div className="cell-actions">
      <button
        type="button"
        className="icon-btn"
        title="Edit expense"
        aria-label={`Edit ${row.title}`}
        onClick={() => openEdit(row)}
      >
        <Pencil size={16} />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn--danger"
        title="Delete expense"
        aria-label={`Delete ${row.title}`}
        onClick={() => setDeleteTarget(row)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  const renderExpenseCard = (row) => (
    <div className="expense-card">
      <div className="expense-card__head">
        <div className="expense-cell">
          <span className="expense-cell__title">{row.title}</span>
          <span className="expense-cell__meta">{prettyLabel(row.category)}</span>
        </div>
        {renderActions(row)}
      </div>
      <div className="expense-card__grid">
        <div className="expense-card__stat">
          <span className="expense-card__label">Amount</span>
          <span className="mono expense-card__amount">{formatCurrency(row.amount)}</span>
        </div>
        <div className="expense-card__stat">
          <span className="expense-card__label">Date</span>
          <span>{formatDate(row.expenseDate)}</span>
        </div>
        <div className="expense-card__stat">
          <span className="expense-card__label">Payee</span>
          <span>{row.payee || '—'}</span>
        </div>
        <div className="expense-card__stat">
          <span className="expense-card__label">Payment</span>
          <span>{prettyLabel(row.paymentMethod)}</span>
        </div>
      </div>
    </div>
  );

  const columns = [
    {
      key: 'title',
      header: 'Expense',
      render: (row) => (
        <div className="expense-cell">
          <span className="expense-cell__title">{row.title}</span>
          <span className="expense-cell__meta">{prettyLabel(row.category)}</span>
        </div>
      ),
    },
    {
      key: 'payee',
      header: 'Payee',
      render: (row) => row.payee || <span className="text-secondary">—</span>,
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      render: (row) => prettyLabel(row.paymentMethod),
    },
    {
      key: 'expenseDate',
      header: 'Date',
      render: (row) => formatDate(row.expenseDate),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => <strong className="mono">{formatCurrency(row.amount)}</strong>,
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
        title="Expenses"
        subtitle={project ? `Project: ${project.name}` : 'Project expenses'}
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Projects', to: '/projects' },
          { label: project?.name || 'Project', to: `/projects/${projectId}` },
          { label: 'Expenses' },
        ]}
        actions={
          <>
            <Link to={`/projects/${projectId}`} className="btn btn-secondary">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to project
            </Link>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} aria-hidden="true" />
              Add Expense
            </button>
          </>
        }
      />

      <div className="card">
        <div className="toolbar toolbar--stack">
          <div className="toolbar__search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              className="form-control"
              placeholder="Search expenses by title or payee…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search expenses"
            />
          </div>

          <select
            className="form-control toolbar__control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {prettyLabel(c)}
              </option>
            ))}
          </select>

          <select
            className="form-control toolbar__control"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort expenses"
          >
            <option value="expenseDate:desc">Date (newest)</option>
            <option value="expenseDate:asc">Date (oldest)</option>
            <option value="amount:desc">Amount (high–low)</option>
            <option value="amount:asc">Amount (low–high)</option>
            <option value="title:asc">Title (A–Z)</option>
          </select>
        </div>

        <div className="toolbar toolbar--dates">
          <label className="date-filter">
            <span>From</span>
            <input
              type="date"
              className="form-control"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="date-filter">
            <span>To</span>
            <input
              type="date"
              className="form-control"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          {hasFilters ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="materials-summary">
          <span>
            <strong>{summary.expenseCount}</strong> expense
            {summary.expenseCount === 1 ? '' : 's'} recorded
          </span>
          <span>
            Total recorded expenses:{' '}
            <strong className="mono">{formatCurrency(summary.totalExpenses)}</strong>
          </span>
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
          ariaLabel="Expenses"
          renderMobileCard={renderExpenseCard}
          empty={
            <EmptyState
              icon={Receipt}
              title={hasFilters ? 'No matching expenses' : 'No expenses recorded'}
              description={
                hasFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Record actual expenses for this project. Adding a material does not create an expense automatically.'
              }
              action={
                !hasFilters ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                    <Plus size={15} aria-hidden="true" />
                    Add Expense
                  </button>
                ) : null
              }
            />
          }
        />

        {!loading && items.length > 0 ? (
          <div className="pagination">
            <span className="pagination-info">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} item
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

      <Modal
        open={modalOpen}
        title={editing ? 'Edit expense' : 'Add expense'}
        onClose={closeModal}
        size="lg"
      >
        <ExpenseForm
          key={editing?._id || 'new'}
          initial={editing}
          projectId={projectId}
          onSaved={handleSaved}
          onCancel={closeModal}
          notify={toast}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete expense?"
        message={
          deleteTarget
            ? `Delete “${deleteTarget.title}” (${formatCurrency(deleteTarget.amount)})? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete expense"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
