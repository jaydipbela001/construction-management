import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HardHat, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Login.css';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Unable to log in. Please try again.');
      if (err.errors) setErrors(err.errors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <div className="login__brand">
        <div className="login__brand-inner">
          <span className="login__logo">
            <HardHat size={28} aria-hidden="true" />
          </span>
          <h1 className="login__brand-title">
            Build<span>Track</span>
          </h1>
          <p className="login__brand-text">
            Manage every construction project, its materials, prices, and expenses — all from
            one focused admin panel.
          </p>
          <ul className="login__features">
            <li>Independent project records</li>
            <li>Custom project-specific materials</li>
            <li>Estimated values vs. recorded expenses</li>
          </ul>
        </div>
      </div>

      <div className="login__panel">
        <div className="login__card">
          <h2 className="login__title">Admin sign in</h2>
          <p className="login__subtitle">Enter your credentials to access the dashboard.</p>

          {serverError ? (
            <div className="alert alert-error login__alert" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          ) : null}

          <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email address
              </label>
              <div className="login__input">
                <Mail size={17} aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>
              {errors.email ? <span className="form-error">{errors.email}</span> : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="login__input">
                <Lock size={17} aria-hidden="true" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>
              {errors.password ? <span className="form-error">{errors.password}</span> : null}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="login__footnote">
            Access is restricted to the single administrator account created with the seed script.
          </p>
        </div>
      </div>
    </div>
  );
}
