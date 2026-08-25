import React, { forwardRef } from 'react'

/**
 * SelectField — labelled select input with ▾ arrow
 */
const SelectField = forwardRef(({
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
}, ref) => {
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
        ref={ref} 
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
})


SelectField.displayName = 'SelectField'

export default SelectField