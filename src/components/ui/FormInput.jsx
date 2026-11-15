/* FormInput — global reusable input with Lucide icons */
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FormInput = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled = false,
  autoComplete,
  required = false,
  leftIcon,
}) => {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPass ? 'text' : 'password') : type;

  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          required={required}
          className={`form-input${leftIcon ? ' has-left-icon' : ''}${
            isPassword ? ' has-right-icon' : ''
          }${error ? ' input-error' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            className="input-icon-right"
            onClick={() => setShowPass((p) => !p)}
            tabIndex={-1}
            aria-label={showPass ? 'Hide password' : 'Show password'}
          >
            {showPass ? (
              <Eye size={17} strokeWidth={2} />
            ) : (
              <EyeOff size={17} strokeWidth={2} />
            )}
          </button>
        )}
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
};

export default FormInput;
