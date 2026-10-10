import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, KeyRound, ShieldCheck, User } from 'lucide-react';
import authService from '../services/authService';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import './Profile.css';

const MIN_PASSWORD_LENGTH = 8;

function PasswordField({ id, label, value, onChange, error, placeholder, autoComplete, disabled }) {
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

export default function Profile() {
  const toast = useToast();
  const { admin, updateAdmin } = useAuth();

  const [profile, setProfile] = useState({ name: admin?.name || '', email: admin?.email || '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const setProfileField = (field, value) =>
    setProfile((p) => ({ ...p, [field]: value }));

  const setPasswordField = (field, value) =>
    setPasswords((p) => ({ ...p, [field]: value }));

  const validateProfile = () => {
    const errors = {};
    if (!profile.email.trim()) errors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(profile.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }
    if (profile.name.trim().length > 120) errors.name = 'Name cannot exceed 120 characters';
    const changed =
      profile.name.trim() !== (admin?.name || '') ||
      profile.email.trim().toLowerCase() !== (admin?.email || '').toLowerCase();
    setProfileErrors(errors);
    return Object.keys(errors).length === 0 && changed;
  };

  const onSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    if (!validateProfile()) return;

    setSavingProfile(true);
    try {
      const updated = await authService.updateProfile({
        name: profile.name.trim() || undefined,
        email: profile.email.trim(),
      });
      updateAdmin(updated);
      toast.success('Profile updated.');
    } catch (err) {
      setProfileError(err.message || 'Unable to update profile.');
      if (err.errors) setProfileErrors(err.errors);
    } finally {
      setSavingProfile(false);
    }
  };

  const validatePasswords = () => {
    const errors = {};
    if (!passwords.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwords.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwords.newPassword.length < MIN_PASSWORD_LENGTH) {
      errors.newPassword = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
    }
    if (passwords.confirmPassword !== passwords.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (!validatePasswords()) return;

    setSavingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message || 'Unable to change password.');
      if (err.errors) setPasswordErrors(err.errors);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Profile"
        subtitle="Manage your name, email, and password for this account."
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Profile' }]}
      />

      <div className="profile-grid">
        <section className="card card-pad">
          <div className="profile-section__head">
            <span className="profile-section__icon" aria-hidden="true">
              <User size={18} />
            </span>
            <h2 className="card-title">Account details</h2>
          </div>

          {profileError ? (
            <div className="alert alert-error mb-4" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{profileError}</span>
            </div>
          ) : null}

          <form onSubmit={onSaveProfile} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">
                Name
              </label>
              <input
                id="profile-name"
                className={`form-control ${profileErrors.name ? 'is-invalid' : ''}`}
                value={profile.name}
                onChange={(e) => setProfileField('name', e.target.value)}
                placeholder="e.g. Site Manager"
                disabled={savingProfile}
              />
              {profileErrors.name ? (
                <span className="form-error">{profileErrors.name}</span>
              ) : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">
                Email<span className="required">*</span>
              </label>
              <input
                id="profile-email"
                type="email"
                autoComplete="email"
                className={`form-control ${profileErrors.email ? 'is-invalid' : ''}`}
                value={profile.email}
                onChange={(e) => setProfileField('email', e.target.value)}
                placeholder="you@example.com"
                disabled={savingProfile}
              />
              {profileErrors.email ? (
                <span className="form-error">{profileErrors.email}</span>
              ) : null}
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              <ShieldCheck size={16} aria-hidden="true" />
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </section>

        <section className="card card-pad">
          <div className="profile-section__head">
            <span className="profile-section__icon" aria-hidden="true">
              <KeyRound size={18} />
            </span>
            <h2 className="card-title">Change password</h2>
          </div>

          {passwordError ? (
            <div className="alert alert-error mb-4" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{passwordError}</span>
            </div>
          ) : null}

          <form onSubmit={onChangePassword} noValidate>
            <PasswordField
              id="current-password"
              label="Current password"
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswordField('currentPassword', e.target.value)}
              error={passwordErrors.currentPassword}
              placeholder="Your current password"
              disabled={savingPassword}
            />

            <PasswordField
              id="new-password"
              label="New password"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(e) => setPasswordField('newPassword', e.target.value)}
              error={passwordErrors.newPassword}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              disabled={savingPassword}
            />

            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              autoComplete="new-password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswordField('confirmPassword', e.target.value)}
              error={passwordErrors.confirmPassword}
              placeholder="Re-enter new password"
              disabled={savingPassword}
            />

            <button type="submit" className="btn btn-primary" disabled={savingPassword}>
              <KeyRound size={16} aria-hidden="true" />
              {savingPassword ? 'Updating…' : 'Change password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}