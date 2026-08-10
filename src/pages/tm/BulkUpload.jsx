import React, { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Papa from 'papaparse'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { getEvent } from '../../data/events'
import { deriveAll } from '../../utils/categoryRules'
import { BELT_GRADES, BELT_LABEL_MAP, BELT_LABELS } from '../../utils/beltGrades'
import { tmNavSections } from '../../utils/navSections'

// BACKEND: fetch column config from GET /api/events/:id/competitor-fields
// to allow per-event required/optional field overrides.

const TEMPLATE_COLUMNS = ['Full Name', 'IC Number', 'Date of Birth', 'Gender', 'Belt Grade', 'Weight (kg)']

const EXAMPLE_ROW = [
  'Ahmad bin Ali',
  '001231-14-5678',
  '2000-12-31',
  'M',
  '3rd Dan (Black)',   // matches BELT_GRADES label exactly
  '72',
]

// Malaysian IC: YYMMDD-PP-ZZZG
const IC_REGEX = /^\d{6}-\d{2}-\d{4}$/

function validateRow(raw, index) {
  const errors = []
  const fullName  = raw['Full Name']?.trim()
  const icNumber  = raw['IC Number']?.trim()
  const dob       = raw['Date of Birth']?.trim()
  const gender    = raw['Gender']?.trim().toUpperCase()
  const beltLabel = raw['Belt Grade']?.trim()
  const weightRaw = raw['Weight (kg)']?.trim()

  if (!fullName) errors.push('Full Name is required')

  if (!icNumber) errors.push('IC Number is required')
  else if (!IC_REGEX.test(icNumber)) errors.push('IC Number must be YYMMDD-PP-ZZZG (e.g. 001231-14-5678)')

  if (!dob) errors.push('Date of Birth is required')
  else if (isNaN(Date.parse(dob))) errors.push('Date of Birth must be YYYY-MM-DD')

  if (!gender) errors.push('Gender is required')
  else if (gender !== 'M' && gender !== 'F') errors.push('Gender must be M or F')

  let beltValue = null
  if (!beltLabel) {
    errors.push('Belt Grade is required')
  } else {
    beltValue = BELT_LABEL_MAP[beltLabel]
    if (!beltValue) {
      errors.push(`Belt Grade not recognised. Use one of the labels from the template, e.g. "3rd Dan (Black)"`)
    }
  }

  const weight = parseFloat(weightRaw)
  if (!weightRaw) errors.push('Weight (kg) is required')
  else if (isNaN(weight) || weight < 10 || weight > 200) errors.push('Weight must be a number between 10 and 200')

  if (errors.length > 0) return { valid: false, errors, rowIndex: index }

  const derived = deriveAll({ dob, gender, beltGrade: beltValue, weightKg: weight })
  return {
    valid: true,
    errors: [],
    rowIndex: index,
    data: {
      fullName,
      icNumber,
      icMasked: icNumber.replace(/^(\d{6}-\d{2}-)(\d{4})$/, '••••••-••-$2'),
      dob,
      gender,
      beltGrade: beltValue,
      weightKg: weight,
      ...derived,
    },
  }
}

function downloadTemplate() {
  const lines = [
    TEMPLATE_COLUMNS.join(','),
    EXAMPLE_ROW.map((v) => (v.includes(',') ? `"${v}"` : v)).join(','),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'roar_competitor_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function BulkUpload() {
  const { id } = useParams()
  const event = getEvent(id)
  const fileRef = useRef(null)

  const [rows, setRows] = useState([])
  const [parsed, setParsed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fileError, setFileError] = useState('')

  const validRows = rows.filter((r) => r.valid)
  const errorRows = rows.filter((r) => !r.valid)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setFileError('Only .csv files are accepted.')
      return
    }
    setFileError('')
    setParsed(false)
    setSubmitted(false)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const validated = result.data.map((raw, i) => validateRow(raw, i))
        setRows(validated)
        setParsed(true)
      },
      error: () => setFileError('Could not parse the file. Make sure it uses the provided template.'),
    })
  }

  function removeRow(rowIndex) {
    setRows((prev) => prev.filter((r) => r.rowIndex !== rowIndex))
  }

  function handleSubmit() {
    // BACKEND: POST /api/events/:id/competitors/bulk  { competitors: validRows.map(r => r.data) }
    console.info('Bulk registration payload (ready for API):', validRows.map((r) => r.data))
    setSubmitted(true)
  }

  function reset() {
    setRows([])
    setParsed(false)
    setSubmitted(false)
    setFileError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="wf">
      <TopBar
        breadcrumbs={[
          { label: 'Events', to: '/events' },
          { label: event?.shortName || id, to: `/events/${id}` },
          { label: 'Competitors', to: `/events/${id}/competitors` },
          { label: 'Bulk Upload' },
        ]}
      />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        <SideNav sections={tmNavSections(id)} />
        <main className="wf-main">
          <PageHead
            title="Bulk Upload Competitors"
            sub="Upload a filled CSV to register multiple competitors at once"
          />

          {submitted ? (
            <div className="box" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <Stamp variant="ok" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Submitted</Stamp>
              <p style={{ color: 'var(--ink-2)', marginTop: '0.75rem', marginBottom: '1.25rem' }}>
                {validRows.length} competitor(s) registered successfully.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <Btn variant="ghost" onClick={reset}>Upload Another</Btn>
                <Btn variant="primary" to={`/events/${id}/competitors`}>View Competitors</Btn>
              </div>
            </div>
          ) : (
            <>
              <div className="box" style={{ marginBottom: '1rem' }}>
                <div className="section-label" style={{ marginBottom: '0.875rem' }}>Step 1 — Get the Template</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--ink-2)', marginBottom: '1rem' }}>
                  Download the CSV template, fill in your competitors, then upload below.
                  Do not change the column headers. For Belt Grade, use the exact label from the template (e.g. <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>3rd Dan (Black)</span>).
                </p>
                <Btn variant="ghost" type="button" onClick={downloadTemplate}>Download CSV Template</Btn>
              </div>

              <div className="box" style={{ marginBottom: '1rem' }}>
                <div className="section-label" style={{ marginBottom: '0.875rem' }}>Step 2 — Upload Filled CSV</div>
                <div className="field-group">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    className={`field-input ${fileError ? 'error' : ''}`}
                    style={{ paddingTop: '0.4rem' }}
                    onChange={handleFile}
                    aria-label="Upload CSV file"
                  />
                  <span className="field-hint">Only .csv files using the template above</span>
                  {fileError && <span className="field-error">{fileError}</span>}
                </div>
              </div>

              {parsed && (
                <div>
                  <div className="box" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', padding: '0.75rem 1rem', flexWrap: 'wrap' }}>
                    <span className="section-label" style={{ margin: 0 }}>Step 3 — Review & Submit</span>
                    <Chip variant="ok">{validRows.length} valid</Chip>
                    {errorRows.length > 0 && <Chip variant="stamp">{errorRows.length} errors</Chip>}
                    <div style={{ marginLeft: 'auto' }}>
                      <Btn variant="primary" type="button" onClick={handleSubmit} disabled={validRows.length === 0}>
                        Register {validRows.length} Competitor{validRows.length !== 1 ? 's' : ''}
                      </Btn>
                    </div>
                  </div>

                  {errorRows.length > 0 && (
                    <div className="box" style={{ marginBottom: '1rem', border: '1px solid var(--stamp)' }}>
                      <div className="section-label" style={{ marginBottom: '0.75rem', color: 'var(--stamp)' }}>
                        Rows with errors — fix in your CSV and re-upload, or remove them below
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {errorRows.map((r) => (
                          <div key={r.rowIndex} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.625rem 0.75rem', background: 'var(--paper-3)', borderRadius: '4px', border: '1px solid var(--stamp)' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', color: 'var(--muted-2)', flexShrink: 0, paddingTop: '2px' }}>
                              Row {r.rowIndex + 2}
                            </span>
                            <div style={{ flex: 1 }}>
                              {r.errors.map((err, i) => (
                                <div key={i} style={{ fontSize: '0.8125rem', color: '#f07060' }}>{err}</div>
                              ))}
                            </div>
                            <Btn variant="ghost" size="sm" onClick={() => removeRow(r.rowIndex)}>Remove</Btn>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {validRows.length > 0 && (
                    <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>IC (Masked)</th>
                            <th>G</th>
                            <th>Belt</th>
                            <th>Age Cat.</th>
                            <th>Belt Group</th>
                            <th>Wt (kg)</th>
                            <th>Weight Class</th>
                            <th>Pattern</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {validRows.map((r) => (
                            <tr key={r.rowIndex}>
                              <td className="mono" style={{ color: 'var(--muted-2)' }}>{r.rowIndex + 2}</td>
                              <td className="name">{r.data.fullName}</td>
                              <td className="mono">{r.data.icMasked}</td>
                              <td style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{r.data.gender}</td>
                              <td><Chip variant="ghost">{r.data.beltGrade}</Chip></td>
                              <td><Chip variant="default">{r.data.ageCategory}</Chip></td>
                              <td><Chip variant="gold">{r.data.beltGroup}</Chip></td>
                              <td className="mono">{r.data.weightKg}</td>
                              <td style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>{r.data.weightClass}</td>
                              <td><Chip variant={r.data.patternFormat === 'Carnival' ? 'warn' : 'ghost'}>{r.data.patternFormat}</Chip></td>
                              <td>
                                <Btn variant="ghost" size="sm" onClick={() => removeRow(r.rowIndex)}>Remove</Btn>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
