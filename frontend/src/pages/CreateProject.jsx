import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import projectService from '../services/projectService';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { PROJECT_STATUSES } from '../utils/constants';
import { toDateInputValue } from '../utils/date';
import './CreateProject.css';

const EMPTY = {
  name: '',
  projectCode: '',
  description: '',
  location: '',
  startDate: '',
  expectedCompletionDate: '',
  actualCompletionDate: '',
  status: 'planned',
  notes: '',
};

export default function CreateProject() {
  const { projectId } = useParams();
  const isEdit = Boolean(projectId);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      setForm(EMPTY);
      return undefined;
    }
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const { project } = await projectService.get(projectId);
        if (!active) return;
        setForm({
          name: project.name || '',
          projectCode: project.projectCode || '',
          description: project.description || '',
          location: project.location || '',
          startDate: toDateInputValue(project.startDate),
          expectedCompletionDate: toDateInputValue(project.expectedCompletionDate),
          actualCompletionDate: toDateInputValue(project.actualCompletionDate),
          status: project.status || 'planned',
          notes: project.notes || '',
        });
      } catch (err) {
        if (active) setServerError(err.message || 'Unable to load project.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [isEdit, projectId]);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Project name is required';
    if (form.startDate && form.expectedCompletionDate && form.expectedCompletionDate < form.startDate) {
      next.expectedCompletionDate = 'Expected completion date cannot be before the start date';
    }
    if (form.startDate && form.actualCompletionDate && form.actualCompletionDate < form.startDate) {
      next.actualCompletionDate = 'Actual completion date cannot be before the start date';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      projectCode: form.projectCode.trim() || undefined,
      description: form.description.trim(),
      location: form.location.trim(),
      startDate: form.startDate || null,
      expectedCompletionDate: form.expectedCompletionDate || null,
      actualCompletionDate: form.actualCompletionDate || null,
      status: form.status,
      notes: form.notes.trim(),
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await projectService.update(projectId, payload);
        toast.success('Project updated.');
        navigate(`/projects/${projectId}`);
      } else {
        const created = await projectService.create(payload);
        toast.success('Project created. It starts with no materials or expenses.');
        navigate(`/projects/${created._id}`);
      }
    } catch (err) {
      setServerError(err.message || 'Unable to save project.');
      if (err.errors) setErrors(err.errors);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner label="Loading project…" />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title={isEdit ? 'Edit Project' : 'New Construction Project'}
        subtitle={
          isEdit
            ? 'Update the project details below.'
            : 'A new project always starts empty — no materials or expenses are copied.'
        }
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Projects', to: '/projects' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Link to={isEdit ? `/projects/${projectId}` : '/projects'} className="btn btn-secondary">
            <ArrowLeft size={16} aria-hidden="true" />
            Cancel
          </Link>
        }
      />

      {serverError ? (
        <div className="alert alert-error mb-6" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      ) : null}

      <form className="card card-pad" onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <div className="form-group span-2">
            <label className="form-label" htmlFor="name">
              Project name<span className="required">*</span>
            </label>
            <input
              id="name"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Residential House"
              disabled={submitting}
            />
            {errors.name ? <span className="form-error">{errors.name}</span> : null}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="projectCode">
              Project code
            </label>
            <input
              id="projectCode"
              className={`form-control ${errors.projectCode ? 'is-invalid' : ''}`}
              value={form.projectCode}
              onChange={(e) => setField('projectCode', e.target.value.toUpperCase())}
              placeholder="Auto-generated if left blank"
              disabled={submitting}
            />
            <span className="form-hint">Must be unique. Leave blank to auto-generate.</span>
            {errors.projectCode ? <span className="form-error">{errors.projectCode}</span> : null}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              className="form-control"
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              disabled={submitting}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group span-2">
            <label className="form-label" htmlFor="location">
              Site address / location
            </label>
            <input
              id="location"
              className="form-control"
              value={form.location}
              onChange={(e) => setField('location', e.target.value)}
              placeholder="e.g. 12 Maple Street, Springfield"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="startDate">
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              className="form-control"
              value={form.startDate}
              onChange={(e) => setField('startDate', e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="expectedCompletionDate">
              Expected completion
            </label>
            <input
              id="expectedCompletionDate"
              type="date"
              className={`form-control ${errors.expectedCompletionDate ? 'is-invalid' : ''}`}
              value={form.expectedCompletionDate}
              onChange={(e) => setField('expectedCompletionDate', e.target.value)}
              disabled={submitting}
            />
            {errors.expectedCompletionDate ? (
              <span className="form-error">{errors.expectedCompletionDate}</span>
            ) : null}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="actualCompletionDate">
              Actual completion
            </label>
            <input
              id="actualCompletionDate"
              type="date"
              className={`form-control ${errors.actualCompletionDate ? 'is-invalid' : ''}`}
              value={form.actualCompletionDate}
              onChange={(e) => setField('actualCompletionDate', e.target.value)}
              disabled={submitting}
            />
            <span className="form-hint">Fill in only when the project is complete.</span>
            {errors.actualCompletionDate ? (
              <span className="form-error">{errors.actualCompletionDate}</span>
            ) : null}
          </div>

          <div className="form-group span-2">
            <label className="form-label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className="form-control"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Short description of the project"
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="form-group span-2">
            <label className="form-label" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              className="form-control"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Optional internal notes"
              rows={2}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="form-actions">
          <Link to={isEdit ? `/projects/${projectId}` : '/projects'} className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Save size={16} aria-hidden="true" />
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </form>
    </div>
  );
}
