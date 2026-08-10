import React from 'react'

const Field = React.forwardRef(function Field(
  { label, name, id, required, hint, error, className = '', inputClassName = '', ...inputProps },
  ref
) {
  const inputId = id || name
  return (
    <div className={`field-group ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
          {required && <span className="field-required">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        name={name}
        className={`field-input ${error ? 'error' : ''} ${inputClassName}`.trim()}
        aria-required={required}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        aria-invalid={!!error}
        {...inputProps}
      />
      {hint && !error && (
        <span id={`${inputId}-hint`} className="field-hint">
          {hint}
        </span>
      )}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
})

export default Field
