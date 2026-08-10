import React from 'react'

/**
 * SelectField — labelled select input with ▾ arrow
 */
export default function SelectField({
  label,
  name,
  id,
  required,
  hint,
  error,
  children,
  className = '',
  inputClassName = '',
  ...selectProps
}) {
  const inputId = id || name
  return (
    <div className={`field-group ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
          {required && <span className="field-required">*</span>}
        </label>
      )}
      <select
        id={inputId}
        name={name}
        className={`field-input field-select ${error ? 'error' : ''} ${inputClassName}`.trim()}
        aria-required={required}
        aria-invalid={!!error}
        {...selectProps}
      >
        {children}
      </select>
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
