import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Eye, EyeOff, ShieldCheck, Trash, UserPlus, Users } from 'lucide-react';
import adminService from '../services/adminService';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/date';
import './Admins.css';

const EMPTY_FORM = { name: '', email: '', password: '', confirmPassword: '', role: 'admin' };
const MIN_PASSWORD_LENGTH = 8;

function PasswordField({ id, label, value, onChange, error, placeholder, disabled, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
        <span className="required">*</span>
      </label>
      <div className="password-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          className="password-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
          disabled={disabled}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error ? <span className="form-error">{error}</span> : null}
    </div>
  );
}

export default function Admins() {
  const toast = useToast();
  const { admin: currentAdmin } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

   const [modalOpen, setModalOpen] = useState(false);
   const [form, setForm] = useState(EMPTY_FORM);
   const [errors, setErrors] = useState({});
   const [serverError, setServerError] = useState('');
   const [confirmTarget, setConfirmTarget] = useState(null);
   const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await adminService.list());
    } catch (err) {
      setError(err.message || 'Unable to load admins.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = 'Please provide a valid email address';
    }
    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Passwords do not match';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const created = await adminService.create({
        name: form.name.trim() || undefined,
        email: form.email.trim(),
        password: form.password,
      });
      toast.success(`Admin ${created.email} created. They can log in now.`);
      setModalOpen(false);
      fetchAdmins();
    } catch (err) {
      setServerError(err.message || 'Unable to create admin.');
      if (err.errors) setErrors(err.errors);
    } finally {
      setSubmitting(false);
    }
  };

   const columns = [
     {
       key: 'name',
       header: 'Admin',
       render: (row) => (
         <div className="admin-cell">
           <span className="admin-cell__avatar" aria-hidden="true">
             {(row.name || row.email || 'A').charAt(0).toUpperCase()}
           </span>
           <div className="admin-cell__meta">
             <span className="admin-cell__name">
               {row.name || 'Administrator'}
               {currentAdmin && row.email === currentAdmin.email ? (
                 <span className="badge badge-info admin-cell__you">You</span>
               ) : null}
             </span>
             <span className="admin-cell__email">{row.email}</span>
           </div>
         </div>
       ),
     },
     {
       key: 'role',
       header: 'Role',
       render: (row) => {
         const roleBadgeClass = row.role === 'superadmin' ? 'badge-warning' : 'badge-neutral';
         const roleLabel = row.role === 'superadmin' ? 'Superadmin' : 'Admin';
         return <span className={`badge ${roleBadgeClass}`}>{roleLabel}</span>;
       },
     },
     {
       key: 'actions',
       header: '',
       render: (row) => {
         const isSelf = currentAdmin && row.email === currentAdmin.email;
         const canDelete = currentAdmin?.role === 'superadmin' && row.role === 'admin' && !isSelf;
         if (!canDelete) return null;
         return (
           <button
             type="button"
             className="btn btn-sm btn-danger"
             onClick={() => {
               setConfirmTarget(row);
             }}
             disabled={deleting}
             aria-label={`Delete ${row.email}`}
           >
             <Trash size={16} aria-hidden="true" />
           </button>
         );
       },
     },
     {
       key: 'createdAt',
       header: 'Added',
       render: (row) => formatDate(row.createdAt),
     },
   ];

  return (
    <div className="page">
      <PageHeader
        title="Admins"
        subtitle="Create admin accounts. Each one can sign in and access this panel."
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Admins' }]}
        actions={
          <button type="button" className="btn btn-primary" onClick={openModal}>
            <UserPlus size={16} aria-hidden="true" />
            Add Admin
          </button>
        }
      />

      <div className="card">
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
          ariaLabel="Admins"
          empty={
            <EmptyState
              icon={Users}
              title="No admins yet"
              description="Add an admin to let someone else sign in to the panel."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={openModal}>
                  <UserPlus size={15} aria-hidden="true" />
                  Add Admin
                </button>
              }
            />
          }
        />
      </div>

      <Modal
        open={modalOpen}
        title="Add new admin"
        onClose={closeModal}
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeModal}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="admin-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              <ShieldCheck size={16} aria-hidden="true" />
              {submitting ? 'Creating…' : 'Create admin'}
            </button>
          </>
        }
      >
        {serverError ? (
          <div className="alert alert-error mb-4" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        ) : null}

        <form id="admin-form" className="admin-form" onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-name">
              Name
            </label>
            <input
              id="admin-name"
              className="form-control"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Site Manager"
              disabled={submitting}
            />
            <span className="form-hint">Optional.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">
              Email<span className="required">*</span>
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="off"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="newadmin@example.com"
              disabled={submitting}
            />
            {errors.email ? <span className="form-error">{errors.email}</span> : null}
          </div>

          <PasswordField
            id="admin-password"
            label="Password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            error={errors.password}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            disabled={submitting}
          />

           <PasswordField
             id="admin-confirm"
             label="Confirm password"
             autoComplete="new-password"
             value={form.confirmPassword}
             onChange={(e) => setField('confirmPassword', e.target.value)}
             error={errors.confirmPassword}
             placeholder="Re-enter password"
             disabled={submitting}
           />
           {currentAdmin?.role === 'superadmin' && (
             <div className="form-group">
               <label className="form-label" htmlFor="admin-role">
                 Role
               </label>
               <select
                 id="admin-role"
                 className="form-control"
                 value={form.role || 'admin'}
                 onChange={(e) => setField('role', e.target.value)}
                 disabled={submitting}
               >
                 <option value="admin">Admin</option>
                 <option value="superadmin">Superadmin</option>
               </select>
             </div>
           )}
         </form>
       </Modal>
       <ConfirmDialog
         open={!!confirmTarget}
         title="Delete admin"
         message={`Are you sure you want to delete ${confirmTarget?.email}? This action cannot be undone.`}
         confirmLabel="Delete"
         cancelLabel="Cancel"
         onConfirm={async () => {
           setDeleting(true);
           try {
             await adminService.remove(confirmTarget.id);
             setConfirmTarget(null);
             setDeleting(false);
             toast.success('Admin deleted.');
             fetchAdmins();
           } catch (err) {
             setDeleting(false);
             toast.error(err.message || 'Failed to delete admin.');
           }
         }}
         onCancel={() => {
           setConfirmTarget(null);
         }}
         loading={deleting}
       />
     </div>
  );
}
