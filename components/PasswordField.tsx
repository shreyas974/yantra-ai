'use client';
import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; help?: string; meter?: boolean };

/** Password input with a visibility toggle and an optional strength meter. */
const PasswordField = forwardRef<HTMLInputElement, Props>(function PasswordField({ label, error, help, meter = false, id, onChange, ...input }, ref) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState('');
  const score = strength(value);
  const describedBy = [help && `${id}-help`, error && `${id}-error`, meter && `${id}-meter`].filter(Boolean).join(' ') || undefined;
  return <div className="auth-field">
    <label htmlFor={id}>{label}</label>
    <div className="auth-input-wrap">
      <input {...input} id={id} ref={ref} type={visible ? 'text' : 'password'} aria-invalid={!!error} aria-describedby={describedBy}
        onChange={event => { setValue(event.target.value); onChange?.(event); }} />
      <button type="button" className="auth-eye" onClick={() => setVisible(v => !v)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
    {meter && <div id={`${id}-meter`} className="auth-meter" data-score={value ? score : -1} aria-live="polite">
      <span /><span /><span /><span />
      <small>{value ? ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score] : 'Use 12 or more characters'}</small>
    </div>}
    {help && <p id={`${id}-help`} className="auth-help">{help}</p>}
    {error && <p id={`${id}-error`} role="alert" className="auth-error-text">{error}</p>}
  </div>;
});
export default PasswordField;

function strength(value: string) {
  if (value.length < 12) return 0;
  let score = 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 16) score++;
  return Math.min(score, 4);
}
