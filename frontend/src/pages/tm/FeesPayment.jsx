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
  const [clubPayments, setClubPayments] = useState([])
  const [hasJustSubmitted, setHasJustSubmitted] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.clubCode) return

      try {
        const eventRes = await fetch(`/api/events/${id}`)
        if (eventRes.ok) setEvent(await eventRes.json())

        const [compRes, teamRes, paymentsRes] = await Promise.all([
          fetch(`/api/competitors/event/${id}/club/${user.clubCode}`),
          fetch(`/api/teams/event/${id}/club/${user.clubCode}`),
          fetch(`/api/events/${id}/payments`)
        ])

        if (compRes.ok) setCompetitors(await compRes.json())
        if (teamRes.ok) setTeams(await teamRes.json())
        
        if (paymentsRes.ok) {
          const allPayments = await paymentsRes.json()
          const myPayments = allPayments.filter(p => p.clubCode === user?.clubCode)
          setClubPayments(myPayments)
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

  // Read dynamic category fees
  const categoryFees = event?.categoryFees ? (typeof event.categoryFees === 'string' ? JSON.parse(event.categoryFees) : event.categoryFees) : {}
  const parsedCats = event?.categories ? (typeof event.categories === 'string' ? JSON.parse(event.categories) : event.categories) : []

  // Dynamic fee calculation grouped by actual category for itemized billing
  const billingItems = []
  let totalDue = 0

  if (parsedCats && parsedCats.length > 0) {
    parsedCats.forEach(catName => {
      const isTeamCat = catName.toLowerCase().includes('team') || catName.toLowerCase().includes('pair')
      const feeRate = parseFloat(categoryFees[catName] || 0)
      let qty = 0

      if (isTeamCat) {
        qty = teams.filter(t => t.categoryName === catName).length
      } else {
        const isSparringCat = catName.toLowerCase().includes('sparring') || catName.toLowerCase().includes('kyorugi')
        const isPatternCat = catName.toLowerCase().includes('pattern') || catName.toLowerCase().includes('poomsae')

        qty = competitors.filter(c => {
          if (isSparringCat && c.isSparring) return true
          if (isPatternCat && c.isPattern) return true
          return false
        }).length
      }

      if (qty > 0) {
        const subtotal = qty * feeRate
        totalDue += subtotal
        billingItems.push({ label: `${catName} Registration`, qty, rate: feeRate, subtotal })
      }
    })
  }

  const totalVerifiedPaid = clubPayments
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0)

  const remainingBalance = Math.max(0, totalDue - totalVerifiedPaid)

  const hasPendingPayment = clubPayments.some(p => p.status === 'pending') || hasJustSubmitted
  const hasRejectedPayment = clubPayments.some(p => p.status === 'rejected') && !hasPendingPayment

  function validateFile(files) {
    if (!files || files.length === 0) return 'Payment proof is required.'
    const file = files[0]
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, WebP, or PDF files are accepted.'
    if (file.size > MAX_FILE_SIZE) return 'File must be 5 MB or smaller.'
    return true
  }

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
      
      setHasJustSubmitted(true)
    } catch (error) {
      console.error(error)
      setFileError('Upload failed. Please try again.')
    }
  }

  const isFullyPaid = totalDue > 0 && remainingBalance === 0
  const timelineItems = [
    { label: 'Registration open', done: true, date: config.regStart },
    { label: 'Competitors registered', done: competitors.length > 0, date: null },
    { label: 'Payment submitted', done: isFullyPaid || hasPendingPayment, active: remainingBalance > 0 && !hasPendingPayment, date: null },
    { label: 'Payment verified by admin', done: isFullyPaid, active: hasPendingPayment && !isFullyPaid, date: null },
    { label: 'Registration confirmed', done: isFullyPaid, date: null }, 
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
        <SideNav sections={tmNavSections(id, event?.type)} />
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
                    {billingItems.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--muted)' }}>
                          No active registrations found.
                        </td>
                      </tr>
                    )}
                    {billingItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.label}</td>
                        <td className="mono">{item.qty}</td> 
                        <td className="mono">{item.rate}</td>
                        <td className="mono">{item.subtotal}</td>
                      </tr>
                    ))}
                    
                    {totalVerifiedPaid > 0 && (
                      <tr style={{ backgroundColor: 'var(--paper-2)' }}>
                        <td colSpan={3} style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ok)' }}>
                          Previously Verified Payments
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', color: 'var(--ok)', fontWeight: 700 }}>
                          - MYR {totalVerifiedPaid}
                        </td>
                      </tr>
                    )}

                    <tr style={{ borderTop: '1px solid var(--line)' }}>
                      <td colSpan={3} style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                        {totalVerifiedPaid > 0 ? 'Remaining Balance Due' : 'Total Due'}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', color: 'var(--gold)', fontWeight: 700 }}>
                        MYR {remainingBalance}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {remainingBalance > 0 && !hasPendingPayment && (
                <div className="box">
                  <div className="section-label" style={{ marginBottom: '0.875rem' }}>Bank Transfer Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[
                      { label: 'Bank', value: event?.bankName || config.bankDetails.bank },
                      { label: 'Account Name', value: event?.bankAccountName || config.bankDetails.accountName },
                      { label: 'Account No.', value: event?.bankAccount || config.bankDetails.accountNo },
                      { label: 'Payment Reference', value: (event?.paymentRefFormat || config.bankDetails.ref).replace('{clubCode}', user?.clubCode || 'YOURCLUB') },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: '3px' }}>{label}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', color: 'var(--ink)', letterSpacing: '0.04em' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DYNAMIC UPLOAD FORM OR STATUS MESSAGE */}
              {remainingBalance > 0 && !hasPendingPayment ? (
                <div className="box">
                  <div className="section-label">Upload Payment Proof</div>
                  {hasRejectedPayment && (
                    <div style={{ padding: '0.75rem', marginBottom: '1rem', background: 'rgba(240, 112, 96, 0.1)', border: '1px solid var(--stamp)', borderRadius: '4px' }}>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--stamp)' }}>
                        A previous payment proof was rejected by the admin. Please upload a new valid receipt for the remaining balance.
                      </p>
                    </div>
                  )}
                  <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <Field
                        label="Payment Reference / Transaction ID"
                        name="paymentRef" id="paymentRef" type="text" autoComplete="off" required
                        placeholder={`e.g. ${(event?.paymentRefFormat || config.bankDetails.ref).replace('{clubCode}', user?.clubCode || 'YOURCLUB')}-20260604`}
                        error={errors.paymentRef?.message}
                        {...register('paymentRef', { required: 'Payment reference is required.', minLength: { value: 5, message: 'Reference too short.' } })}
                      />
                      <Field
                        label="Amount Transferred (MYR)"
                        name="paymentAmount" id="paymentAmount" type="number" inputMode="decimal" autoComplete="off" required
                        placeholder={String(remainingBalance)}
                        defaultValue={String(remainingBalance)}
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
              ) : isFullyPaid ? (
                <div className="box" style={{ textAlign: 'center', padding: '2.5rem' }}>
                  <Stamp variant="ok" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Paid in Full</Stamp>
                  <p style={{ color: 'var(--ink-2)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                    Your total payments of MYR {totalVerifiedPaid} cover your entire roster.
                  </p>
                  <p style={{ color: 'var(--muted-2)', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    Your registration for this event is confirmed.
                  </p>
                </div>
              ) : (
                <div className="box" style={{ textAlign: 'center', padding: '2.5rem' }}>
                  <Stamp variant="gold" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Pending Admin Verification</Stamp>
                  <p style={{ color: 'var(--ink-2)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                    You have submitted a payment proof for the remaining balance.
                  </p>
                  <p style={{ color: 'var(--muted-2)', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    Your receipt is currently awaiting admin verification.
                  </p>
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