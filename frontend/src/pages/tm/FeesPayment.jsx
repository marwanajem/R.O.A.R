import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Field from '../../components/ui/Field'
import Btn from '../../components/ui/Btn'
import Stamp from '../../components/ui/Stamp'
import { useAuth } from '../../contexts/AuthContext'
import { tmNavSections } from '../../utils/navSections'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const config = {
  bankDetails: {
    bank: 'Maybank',
    accountName: 'ROAR Championship',
    accountNo: '5123-4567-8901',
    ref: 'ROAR26-{clubCode}'
  },
  regStart: '2026-01-01'
}

export default function FeesPayment() {
  const { id } = useParams()
  const { user } = useAuth()
  
  const [event, setEvent] = useState(null)
  const [competitors, setCompetitors] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [fileError, setFileError] = useState('')
  const [submitted, setSubmitted] = useState(false)

 useEffect(() => {
    const fetchData = async () => {
      if (!user?.clubCode) return

      try {
        const eventRes = await fetch(`/api/events/${id}`)
        if (eventRes.ok) setEvent(await eventRes.json())

        // Fetch competitors, teams, existing payments
        const [compRes, teamRes, paymentsRes] = await Promise.all([
          fetch(`/api/competitors/event/${id}/club/${user.clubCode}`),
          fetch(`/api/teams/event/${id}/club/${user.clubCode}`),
          fetch(`/api/events/${id}/payments`)
        ])

        if (compRes.ok) setCompetitors(await compRes.json())
        if (teamRes.ok) setTeams(await teamRes.json())
        
        // Check if this club already submitted a payment
        if (paymentsRes.ok) {
          const payments = await paymentsRes.json()
          const myPayment = payments.find(p => p.clubCode === user?.clubCode)
          if (myPayment) setSubmitted(true)
        }
      } catch (error) {
        console.error('Failed to load invoice data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, user?.clubCode])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  // FIXED: Dynamically read the fees from the database, fallback to 0 if loading
  const indivRate = parseFloat(event?.individualFee || 0)
  const teamRate = parseFloat(event?.teamFee || 0)
  
  const indivFees = competitors.length * indivRate
  const teamFees = teams.length * teamRate
  const totalDue = indivFees + teamFees

  function validateFile(files) {
    if (!files || files.length === 0) return 'Payment proof is required.'
    const file = files[0]
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, WebP, or PDF files are accepted.'
    if (file.size > MAX_FILE_SIZE) return 'File must be 5 MB or smaller.'
    return true
  }

  // FIXED: Implemented actual FormData upload to match backend
  const onSubmit = async (data) => {
    const fileValidation = validateFile(data.proofFile)
    if (fileValidation !== true) {
      setFileError(fileValidation)
      return
    }
    setFileError('')
    
    const formData = new FormData()
    formData.append('userId', user.id) 
    formData.append('referenceCode', data.paymentRef)
    formData.append('amount', data.paymentAmount)
    formData.append('proofFile', data.proofFile[0])

    try {
      const response = await fetch(`/api/events/${id}/payments`, {
        method: 'POST',
        body: formData, 
      })
      if (!response.ok) throw new Error('Failed to upload payment proof')
      setSubmitted(true)
    } catch (error) {
      console.error(error)
      setFileError('Upload failed. Please try again.')
    }
  }

  const timelineItems = [
    { label: 'Registration open', done: true, date: config.regStart },
    { label: 'Competitors registered', done: competitors.length > 0, date: null },
    { label: 'Payment submitted', done: submitted, active: !submitted, date: null },
    { label: 'Payment verified by admin', done: false, date: null },
    { label: 'Registration confirmed', done: false, date: null },
  ]

  if (loading) {
    return (
      <div className="wf">
        <TopBar />
        <div className="wf-main" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--muted)' }}>Calculating invoice...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Events', to: '/events' }, { label: event?.shortName || id, to: `/events/${id}` }, { label: 'Fees & Payment' }]} />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        <SideNav sections={tmNavSections(id)} />
        <main className="wf-main">
          <PageHead title="Fees & Payment" sub="Submit bank transfer proof for admin verification" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="box">
                <div className="section-label">Fee Breakdown</div>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Rate (MYR)</th>
                      <th>Subtotal (MYR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Individual Registration</td>
                      <td className="mono">{competitors.length}</td>
                      <td className="mono">{indivRate}</td>
                      <td className="mono">{indivFees}</td>
                    </tr>
                    <tr>
                      <td>Team / Pair Registration</td>
                      <td className="mono">{teams.length}</td>
                      <td className="mono">{teamRate}</td>
                      <td className="mono">{teamFees}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid var(--line)' }}>
                      <td colSpan={3} style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                        Total Due
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', color: 'var(--gold)', fontWeight: 700 }}>
                        MYR {totalDue}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="box">
                <div className="section-label" style={{ marginBottom: '0.875rem' }}>Bank Transfer Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'Bank', value: config.bankDetails.bank },
                    { label: 'Account Name', value: config.bankDetails.accountName },
                    { label: 'Account No.', value: config.bankDetails.accountNo },
                    { label: 'Payment Reference', value: config.bankDetails.ref.replace('{clubCode}', user?.clubCode || 'YOURCLUB') },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: '3px' }}>{label}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', color: 'var(--ink)', letterSpacing: '0.04em' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {!submitted ? (
                <div className="box">
                  <div className="section-label">Upload Payment Proof</div>
                  <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <Field
                        label="Payment Reference / Transaction ID"
                        name="paymentRef" id="paymentRef" type="text" autoComplete="off" required
                        placeholder={`e.g. ${config.bankDetails.ref.replace('{clubCode}', user?.clubCode || 'YOURCLUB')}-20260604`}
                        error={errors.paymentRef?.message}
                        {...register('paymentRef', { required: 'Payment reference is required.', minLength: { value: 5, message: 'Reference too short.' } })}
                      />
                      <Field
                        label="Amount Transferred (MYR)"
                        name="paymentAmount" id="paymentAmount" type="number" inputMode="decimal" autoComplete="off" required
                        placeholder={String(totalDue)}
                        error={errors.paymentAmount?.message}
                        {...register('paymentAmount', { required: 'Amount is required.', min: { value: 1, message: 'Amount must be positive.' } })}
                      />

                      <div className="field-group">
                        <label htmlFor="proofFile" className="field-label">
                          Receipt / Screenshot<span className="field-required">*</span>
                        </label>
                        <input
                          id="proofFile" name="proofFile" type="file" accept="image/*,application/pdf"
                          className={`field-input ${fileError || errors.proofFile ? 'error' : ''}`}
                          style={{ paddingTop: '0.4rem' }} aria-required
                          {...register('proofFile', { required: 'Please attach the payment receipt.' })}
                        />
                        <span className="field-hint">JPG, PNG, WebP or PDF · max 5 MB</span>
                        {(fileError || errors.proofFile) && <span className="field-error">{fileError || errors.proofFile?.message}</span>}
                      </div>
                    </div>
                    <hr className="divider" />
                    <Btn variant="primary" type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
                      {isSubmitting ? 'Submitting…' : 'Submit Payment Proof'}
                    </Btn>
                  </form>
                </div>
              ) : (
                <div className="box" style={{ textAlign: 'center', padding: '2rem' }}>
                  <Stamp variant="ok" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Submitted</Stamp>
                  <p style={{ color: 'var(--ink-2)', marginTop: '0.75rem' }}>Payment proof submitted. Awaiting admin verification.</p>
                </div>
              )}
            </div>

            <div className="box-fill" style={{ position: 'sticky', top: '1.5rem' }}>
              <div className="section-label">Status Timeline</div>
              <div className="timeline">
                {timelineItems.map((item, i) => (
                  <div key={i} className="timeline-item">
                    <div className={`timeline-dot ${item.done ? 'done' : item.active ? 'active' : ''}`} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8125rem', color: item.done ? 'var(--ok)' : item.active ? 'var(--gold)' : 'var(--muted)', fontWeight: item.active ? 600 : 400 }}>{item.label}</div>
                      {item.date && <div style={{ fontSize: '0.6875rem', color: 'var(--muted-2)', fontFamily: 'JetBrains Mono, monospace' }}>{item.date}</div>}
                    </div>
                    {item.done && <Stamp variant="ok" style={{ fontSize: '0.6rem' }}>Done</Stamp>}
                    {item.active && !item.done && <Stamp variant="gold">Pending</Stamp>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}