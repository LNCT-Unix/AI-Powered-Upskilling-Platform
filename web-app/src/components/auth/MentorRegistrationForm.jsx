import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  UserCircle2,
} from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,24}$/;

const INITIAL_VALUES = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

function validate(values) {
  const errors = {};

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = 'Name must be at least 2 characters.';
  }

  if (!values.username.trim()) {
    errors.username = 'Username is required.';
  } else if (!USERNAME_REGEX.test(values.username.trim())) {
    errors.username = 'Use 3–24 letters, numbers, dots, or underscores.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export default function MentorRegistrationForm({ onBack, onPreviewDashboard }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);

    if (touched[name]) {
      const fieldErrors = validate(nextValues);
      setErrors((previous) => ({ ...previous, [name]: fieldErrors[name] }));
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((previous) => ({ ...previous, [name]: true }));
    const fieldErrors = validate(values);
    setErrors((previous) => ({ ...previous, [name]: fieldErrors[name] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const allTouched = {
      fullName: true,
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    };
    setTouched(allTouched);

    const fieldErrors = validate(values);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      const firstField = Object.keys(fieldErrors)[0];
      document.getElementById(`mentor-${firstField}`)?.focus();
      return;
    }

    setLoading(true);
    // Frontend demo only: simulate a short UI step. No API request is made.
    await new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });
    setLoading(false);
    setSubmitted(true);
  };

  const resetForm = () => {
    setValues(INITIAL_VALUES);
    setErrors({});
    setTouched({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="auth-form mentor-form">
        <button type="button" className="mentor-back" onClick={onBack}>
          <ArrowLeft size={15} /> Back to Login / Sign Up
        </button>

        <div className="mentor-success">
          <div className="mentor-success-icon">
            <CheckCircle2 size={30} />
          </div>
          <span className="mentor-kicker">
            <Sparkles size={12} /> Mentor demo ready
          </span>
          <h1 className="title">Thanks, {values.fullName.split(' ')[0]}!</h1>
          <p className="subtitle">
            Your mentor registration details passed the frontend validation. You can now explore
            the mentor studio with illustrative cohort data.
          </p>

          <div className="mentor-demo-notice">
            <AlertCircle size={16} />
            <span>
              <strong>Demo only:</strong> no mentor account was created, no credentials were sent
              anywhere, and no real role or access was granted.
            </span>
          </div>

          <button type="button" className="btn" onClick={onPreviewDashboard}>
            <span>Preview Mentor Dashboard</span>
            <ArrowRight size={16} />
          </button>
          <button type="button" className="btn-ghost w-full" onClick={onBack}>
            <ArrowLeft size={15} />
            <span>Back to Login / Sign Up</span>
          </button>
          <button
            type="button"
            className="mentor-text-button"
            onClick={resetForm}
          >
            Fill the demo form again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form mentor-form">
      <button type="button" className="mentor-back" onClick={onBack}>
        <ArrowLeft size={15} /> Back to Login / Sign Up
      </button>

      <div className="mentor-form-head">
        <span className="mentor-kicker">
          <GraduationCap size={13} /> Mentor registration
        </span>
        <h1 className="title">Become a mentor</h1>
        <p className="subtitle">
          Share your expertise, guide learners, and track their progress. This form is a
          frontend-only demonstration.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className={`field ${touched.fullName && errors.fullName ? 'has-error' : ''}`}>
          <label htmlFor="mentor-fullName">Full name</label>
          <input
            id="mentor-fullName"
            name="fullName"
            type="text"
            value={values.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Your full name"
            autoComplete="name"
            disabled={loading}
            aria-invalid={Boolean(touched.fullName && errors.fullName)}
          />
          {touched.fullName && errors.fullName && (
            <p className="field-error">{errors.fullName}</p>
          )}
        </div>

        <div className={`field ${touched.username && errors.username ? 'has-error' : ''}`}>
          <label htmlFor="mentor-username">Username</label>
          <div className="mentor-input-icon">
            <UserCircle2 size={16} aria-hidden="true" />
            <input
              id="mentor-username"
              name="username"
              type="text"
              value={values.username}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. meera.mentor"
              autoComplete="username"
              disabled={loading}
              aria-invalid={Boolean(touched.username && errors.username)}
            />
          </div>
          {touched.username && errors.username && (
            <p className="field-error">{errors.username}</p>
          )}
        </div>

        <div className={`field ${touched.email && errors.email ? 'has-error' : ''}`}>
          <label htmlFor="mentor-email">Email</label>
          <div className="mentor-input-icon">
            <Mail size={16} aria-hidden="true" />
            <input
              id="mentor-email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
              aria-invalid={Boolean(touched.email && errors.email)}
            />
          </div>
          {touched.email && errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div className={`field ${touched.password && errors.password ? 'has-error' : ''}`}>
          <label htmlFor="mentor-password">Password</label>
          <div className="pass-wrap mentor-pass">
            <Lock size={16} className="mentor-input-leading" aria-hidden="true" />
            <input
              id="mentor-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Create a strong password (min. 8 characters)"
              autoComplete="new-password"
              disabled={loading}
              aria-invalid={Boolean(touched.password && errors.password)}
            />
            <button
              type="button"
              className="eye"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {touched.password && errors.password && (
            <p className="field-error">{errors.password}</p>
          )}
        </div>

        <div className={`field ${touched.confirmPassword && errors.confirmPassword ? 'has-error' : ''}`}>
          <label htmlFor="mentor-confirmPassword">Confirm password</label>
          <div className="pass-wrap mentor-pass">
            <Lock size={16} className="mentor-input-leading" aria-hidden="true" />
            <input
              id="mentor-confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              disabled={loading}
              aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
            />
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="field-error">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="mentor-demo-notice">
          <AlertCircle size={16} />
          <span>
            <strong>Frontend demo:</strong> submitting this form does not create an account or
            authenticate you. Use the preview to explore the mentor dashboard.
          </span>
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Preparing demo…</span>
            </>
          ) : (
            <>
              <GraduationCap size={17} />
              <span>Create Mentor Account</span>
            </>
          )}
        </button>
      </form>

      <p className="fineprint">
        Already have an account?{' '}
        <button type="button" className="auth-link mentor-text-button" onClick={onBack}>
          Back to Login / Sign Up
        </button>
      </p>
    </div>
  );
}
