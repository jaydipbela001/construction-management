import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Package,
  AlertCircle,
  Save,
} from 'lucide-react';
import materialService from '../services/materialService';
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
import { MATERIAL_UNITS, PAGE_SIZE } from '../utils/constants';
import { round2 } from '../utils/number';
import './Materials.css';

const EMPTY_MATERIAL = {
  name: '',
  category: '',
  description: '',
  quantity: '',
  usedQuantity: '',
  unit: 'kg',
  customUnit: '',
  unitPrice: '',
  supplier: '',
  purchaseDate: '',
  notes: '',
};

function MaterialForm({ initial, projectId, onSaved, onCancel, notify }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY_MATERIAL;
    const knownUnits = MATERIAL_UNITS.filter((u) => u !== 'custom');
    const isCustom = initial.unit && !knownUnits.includes(initial.unit);
    return {
      name: initial.name || '',
      category: initial.category || '',
      description: initial.description || '',
      quantity: initial.quantity ?? '',
      usedQuantity: initial.usedQuantity ?? '',
      unit: isCustom ? 'custom' : initial.unit || 'kg',
      customUnit: isCustom ? initial.unit : '',
      unitPrice: initial.unitPrice ?? '',
      supplier: initial.supplier || '',
      purchaseDate: toDateInputValue(initial.purchaseDate),
      notes: initial.notes || '',
    };
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const unit = form.unit === 'custom' ? form.customUnit.trim() : form.unit;

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Material name is required';
    const qty = Number(form.quantity);
    if (form.quantity === '' || Number.isNaN(qty)) next.quantity = 'Quantity must be a number';
    else if (qty <= 0) next.quantity = 'Quantity must be greater than zero';
    const used = Number(form.usedQuantity);
    if (form.usedQuantity !== '' && (Number.isNaN(used) || used < 0)) {
      next.usedQuantity = 'Used quantity must be zero or more';
    } else if (!next.quantity && form.usedQuantity !== '' && used > qty) {
      next.usedQuantity = 'Used quantity cannot exceed the total quantity';
    }
    const price = Number(form.unitPrice);
    if (form.unitPrice === '' || Number.isNaN(price)) next.unitPrice = 'Unit price must be a number';
    else if (price < 0) next.unitPrice = 'Unit price cannot be negative';
    if (!unit) next.unit = 'Unit is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const preview = useMemo(() => {
    const q = Number(form.quantity);
    const p = Number(form.unitPrice);
    if (!Number.isFinite(q) || !Number.isFinite(p) || q <= 0 || p < 0) return 0;
    return round2(q * p);
  }, [form.quantity, form.unitPrice]);

  const stockPreview = useMemo(() => {
    const q = Number(form.quantity);
    const u = form.usedQuantity === '' ? 0 : Number(form.usedQuantity);
    if (!Number.isFinite(q) || !Number.isFinite(u)) return null;
    return round2(q - u);
  }, [form.quantity, form.usedQuantity]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      quantity: Number(form.quantity),
      usedQuantity: form.usedQuantity === '' ? 0 : Number(form.usedQuantity),
      unit,
      unitPrice: Number(form.unitPrice),
      supplier: form.supplier.trim(),
      purchaseDate: form.purchaseDate || null,
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await materialService.update(projectId, initial._id, payload);
        notify.success('Material updated.');
      } else {
        await materialService.create(projectId, payload);
        notify.success('Material added.');
      }
      onSaved();
    } catch (err) {
      setServerError(err.message || 'Unable to save material.');
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
          <label className="form-label" htmlFor="m-name">
            Material name<span className="required">*</span>
          </label>
          <input
            id="m-name"
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="e.g. Cement, Iron, Sand, or any custom material"
            disabled={saving}
          />
          {errors.name ? <span className="form-error">{errors.name}</span> : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="m-category">
            Category
          </label>
          <input
            id="m-category"
            className="form-control"
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            placeholder="Optional"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="m-supplier">
            Supplier
          </label>
          <input
            id="m-supplier"
            className="form-control"
            value={form.supplier}
            onChange={(e) => setField('supplier', e.target.value)}
            placeholder="Optional"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="m-quantity">
            Quantity<span className="required">*</span>
          </label>
          <input
            id="m-quantity"
            type="number"
            min="0"
            step="any"
            className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
            value={form.quantity}
            onChange={(e) => setField('quantity', e.target.value)}
            placeholder="0"
            disabled={saving}
          />
          {errors.quantity ? <span className="form-error">{errors.quantity}</span> : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="m-used">
            Used quantity
          </label>
          <input
            id="m-used"
            type="number"
            min="0"
            step="any"
            className={`form-control ${errors.usedQuantity ? 'is-invalid' : ''}`}
            value={form.usedQuantity}
            onChange={(e) => setField('usedQuantity', e.target.value)}
            placeholder="0"
            disabled={saving}
          />
          <span className="form-hint">How much has been used. Leave blank for none.</span>
          {errors.usedQuantity ? <span className="form-error">{errors.usedQuantity}</span> : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="m-unit">
            Unit<span className="required">*</span>
          </label>
          <select
            id="m-unit"
            className={`form-control ${errors.unit ? 'is-invalid' : ''}`}
            value={form.unit}
            onChange={(e) => setField('unit', e.target.value)}
            disabled={saving}
          >
            {MATERIAL_UNITS.map((u) => (
              <option key={u} value={u}>
                {u === 'custom' ? 'Custom…' : u}
              </option>
            ))}
          </select>
          {form.unit === 'custom' ? (
            <input
              className={`form-control mt-2 ${errors.unit ? 'is-invalid' : ''}`}
              value={form.customUnit}
              onChange={(e) => setField('customUnit', e.target.value)}
              placeholder="Enter custom unit"
              disabled={saving}
            />
          ) : null}
          {errors.unit ? <span className="form-error">{errors.unit}</span> : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="m-price">
            Unit price<span className="required">*</span>
          </label>
          <input
            id="m-price"
            type="number"
            min="0"
            step="any"
            className={`form-control ${errors.unitPrice ? 'is-invalid' : ''}`}
            value={form.unitPrice}
            onChange={(e) => setField('unitPrice', e.target.value)}
            placeholder="0.00"
            disabled={saving}
          />
          {errors.unitPrice ? <span className="form-error">{errors.unitPrice}</span> : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="m-date">
            Purchase date
          </label>
          <input
            id="m-date"
            type="date"
            className="form-control"
            value={form.purchaseDate}
            onChange={(e) => setField('purchaseDate', e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="form-group span-2">
          <label className="form-label" htmlFor="m-description">
            Description
          </label>
          <textarea
            id="m-description"
            className="form-control"
            rows={2}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Optional"
            disabled={saving}
          />
        </div>

        <div className="form-group span-2">
          <label className="form-label" htmlFor="m-notes">
            Notes
          </label>
          <textarea
            id="m-notes"
            className="form-control"
            rows={2}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Optional"
            disabled={saving}
          />
        </div>
      </div>

      <div className="material-form__preview">
        <div className="material-form__stat">
          <span>Remaining stock</span>
          <strong className="mono">
            {stockPreview == null ? '—' : `${stockPreview} ${unit || ''}`.trim()}
          </strong>
        </div>
        <div className="material-form__stat">
          <span>Estimated line total</span>
          <strong className="mono">{formatCurrency(preview)}</strong>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save size={16} aria-hidden="true" />
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add material'}
        </button>
      </div>
    </form>
  );
}

function MaterialDetails({ material }) {
  if (!material) return null;

  const quantity = material.quantity || 0;
  const used = material.usedQuantity || 0;
  const stock = material.currentStock ?? quantity - used;
  const out = Number(stock) <= 0;

  const rows = [
    ['Total quantity', `${quantity} ${material.unit || ''}`.trim()],
    ['Used quantity', `${used} ${material.unit || ''}`.trim()],
    ['Unit price', formatCurrency(material.unitPrice)],
    ['Line total', formatCurrency(material.lineTotal || 0)],
    ['Category', material.category || '—'],
    ['Supplier', material.supplier || '—'],
    ['Purchase date', formatDate(material.purchaseDate)],
    ['Description', material.description || '—'],
    ['Notes', material.notes || '—'],
  ];

  return (
    <div className="material-details">
      <div className={`material-details__hero ${out ? 'is-out' : ''}`}>
        <span className="material-details__hero-label">Remaining stock</span>
        <span className="material-details__hero-value mono">
          {stock} {material.unit}
        </span>
      </div>

      <dl className="material-details__list">
        {rows.map(([label, value]) => (
          <div className="material-details__row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Materials() {
  const { projectId } = useParams();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ materialCount: 0, estimatedMaterialValue: 0 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [knownCategories, setKnownCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
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

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await materialService.list(projectId, {
        search: debouncedSearch || undefined,
        category: category || undefined,
        sortBy,
        order,
        page,
        limit: PAGE_SIZE,
      });
      setItems(data.items);
      setSummary(data.summary);
      setPagination(data.pagination);
      setKnownCategories((prev) => {
        const set = new Set(prev);
        data.items.forEach((m) => {
          if (m.category) set.add(m.category);
        });
        return [...set].sort();
      });
    } catch (err) {
      setError(err.message || 'Unable to load materials.');
    } finally {
      setLoading(false);
    }
  }, [projectId, debouncedSearch, category, sortBy, order, page]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, sort]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (material) => {
    setEditing(material);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSaved = () => {
    closeModal();
    fetchMaterials();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await materialService.remove(projectId, deleteTarget._id);
      toast.success('Material deleted.');
      setDeleteTarget(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchMaterials();
    } catch (err) {
      toast.error(err.message || 'Failed to delete material.');
    } finally {
      setDeleting(false);
    }
  };

  const renderActions = (row) => (
    <div className="cell-actions">
      <button
        type="button"
        className="icon-btn"
        title="View material"
        aria-label={`View ${row.name}`}
        onClick={() => setViewTarget(row)}
      >
        <Eye size={16} />
      </button>
      <button
        type="button"
        className="icon-btn"
        title="Edit material"
        aria-label={`Edit ${row.name}`}
        onClick={() => openEdit(row)}
      >
        <Pencil size={16} />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn--danger"
        title="Delete material"
        aria-label={`Delete ${row.name}`}
        onClick={() => setDeleteTarget(row)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  const renderMaterialCard = (row) => {
    const stock = row.currentStock ?? (row.quantity || 0) - (row.usedQuantity || 0);
    const out = Number(stock) <= 0;
    return (
      <div className="material-card">
        <div className="material-card__head">
          <div className="material-cell">
            <span className="material-cell__name">{row.name}</span>
            {row.category ? <span className="material-cell__cat">{row.category}</span> : null}
          </div>
          {renderActions(row)}
        </div>
        <div className="material-card__grid">
          <div className="material-card__stat">
            <span className="material-card__label">Remaining</span>
            <span className={`badge ${out ? 'badge-danger' : 'badge-success'} mono`}>
              {stock} {row.unit}
            </span>
          </div>
          <div className="material-card__stat">
            <span className="material-card__label">Total</span>
            <span className="mono">
              {row.quantity} {row.unit}
            </span>
          </div>
          <div className="material-card__stat">
            <span className="material-card__label">Used</span>
            <span className="mono">
              {row.usedQuantity || 0} {row.unit}
            </span>
          </div>
          <div className="material-card__stat">
            <span className="material-card__label">Line total</span>
            <span className="mono">{formatCurrency(row.lineTotal || 0)}</span>
          </div>
        </div>
      </div>
    );
  };

  const columns = [
    {
      key: 'name',
      header: 'Material',
      render: (row) => (
        <div className="material-cell">
          <span className="material-cell__name">{row.name}</span>
          {row.category ? <span className="material-cell__cat">{row.category}</span> : null}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Total',
      align: 'right',
      render: (row) => (
        <span className="mono">
          {row.quantity} {row.unit}
        </span>
      ),
    },
    {
      key: 'usedQuantity',
      header: 'Used',
      align: 'right',
      render: (row) => (
        <span className="mono text-secondary">
          {row.usedQuantity || 0} {row.unit}
        </span>
      ),
    },
    {
      key: 'currentStock',
      header: 'In stock',
      align: 'right',
      render: (row) => {
        const stock = row.currentStock ?? (row.quantity || 0) - (row.usedQuantity || 0);
        const out = Number(stock) <= 0;
        return (
          <span className={`badge ${out ? 'badge-danger' : 'badge-success'} mono`}>
            {stock} {row.unit}
          </span>
        );
      },
    },
    {
      key: 'unitPrice',
      header: 'Unit price',
      align: 'right',
      render: (row) => <span className="mono">{formatCurrency(row.unitPrice)}</span>,
    },
    {
      key: 'lineTotal',
      header: 'Line total',
      align: 'right',
      render: (row) => <strong className="mono">{formatCurrency(row.lineTotal || 0)}</strong>,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row) => row.supplier || <span className="text-secondary">—</span>,
    },
    {
      key: 'purchaseDate',
      header: 'Purchased',
      render: (row) => formatDate(row.purchaseDate),
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
        title="Materials"
        subtitle={project ? `Project: ${project.name}` : 'Project materials'}
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Projects', to: '/projects' },
          { label: project?.name || 'Project', to: `/projects/${projectId}` },
          { label: 'Materials' },
        ]}
        actions={
          <>
            <Link to={`/projects/${projectId}`} className="btn btn-secondary">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to project
            </Link>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} aria-hidden="true" />
              Add Material
            </button>
          </>
        }
      />

      <div className="card">
        <div className="toolbar">
          <div className="toolbar__search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              className="form-control"
              placeholder="Search materials by name or supplier…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search materials"
            />
          </div>

          <select
            className="form-control toolbar__control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {knownCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="form-control toolbar__control"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort materials"
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="name:asc">Name (A–Z)</option>
            <option value="unitPrice:desc">Unit price (high–low)</option>
            <option value="unitPrice:asc">Unit price (low–high)</option>
            <option value="quantity:desc">Quantity (high–low)</option>
          </select>
        </div>

        <div className="materials-summary">
          <span>
            <strong>{summary.materialCount}</strong> material entr
            {summary.materialCount === 1 ? 'y' : 'ies'}
          </span>
          <span>
            Estimated material value:{' '}
            <strong className="mono">{formatCurrency(summary.estimatedMaterialValue)}</strong>
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
          ariaLabel="Materials"
          renderMobileCard={renderMaterialCard}
          empty={
            <EmptyState
              icon={Package}
              title={debouncedSearch || category ? 'No matching materials' : 'No materials yet'}
              description={
                debouncedSearch || category
                  ? 'Try adjusting your search or filters.'
                  : 'This project has no materials. Add your first custom material.'
              }
              action={
                !debouncedSearch && !category ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                    <Plus size={15} aria-hidden="true" />
                    Add Material
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
        title={editing ? 'Edit material' : 'Add material'}
        onClose={closeModal}
        size="lg"
      >
        <MaterialForm
          key={editing?._id || 'new'}
          initial={editing}
          projectId={projectId}
          onSaved={handleSaved}
          onCancel={closeModal}
          notify={toast}
        />
      </Modal>

      <Modal
        open={Boolean(viewTarget)}
        title={viewTarget?.name || 'Material'}
        onClose={() => setViewTarget(null)}
        size="md"
        footer={
          <button type="button" className="btn btn-primary" onClick={() => setViewTarget(null)}>
            Close
          </button>
        }
      >
        <MaterialDetails material={viewTarget} />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete material?"
        message={
          deleteTarget
            ? `Delete “${deleteTarget.name}” from this project? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete material"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
