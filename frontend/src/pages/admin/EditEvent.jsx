import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Field from '../../components/ui/Field'
import Btn from '../../components/ui/Btn'
import { adminTopNavSections } from '../../utils/navSections'

const STEPS = [
  { num: 1, label: 'Basics & Logistics' },
  { num: 2, label: 'Ruleset & Template' },
  { num: 3, label: 'Fees & Policy' },
  { num: 4, label: 'Review & Publish' },
]

function StepBar({ current }) {
  return (
    <div className="step-bar" style={{ marginBottom: '2rem' }}>
      {STEPS.map((step, i) => {
        const state = step.num < current ? 'done' : step.num === current ? 'active' : ''
        return (
          <React.Fragment key={step.num}>
            <div className={`step-item ${state}`}>
              <div className="step-num">{step.num < current ? '✓' : step.num}</div>
              <span>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="step-connector" />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ==========================================
// STEP 1 — BASICS & LOGISTICS
// ==========================================
function StepBasics() {
  const { register, formState: { errors }, watch } = useFormContext()
  const eventDate = watch('eventDate')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Field label="Event Name" id="name" type="text" required placeholder="e.g. ROAR Open Championship 2027" error={errors.name?.message} {...register('name', { required: 'Event name is required.' })} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Event Date (Start)" id="eventDate" type="date" required error={errors.eventDate?.message} {...register('eventDate', { required: 'Event start date is required.' })} />
        <Field label="Event Date (End)" id="eventDateEnd" type="date" error={errors.eventDateEnd?.message} {...register('eventDateEnd')} />
      </div>
      <Field label="Venue" id="venue" type="text" required placeholder="e.g. Stadium Putra Bukit Jalil, Kuala Lumpur" error={errors.venue?.message} {...register('venue', { required: 'Venue is required.' })} />
      <hr className="divider" style={{ margin: '0.5rem 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Registration Opens" id="regStart" type="date" required error={errors.regStart?.message} {...register('regStart', { required: 'Registration open date is required.' })} />
        <Field label="Registration Closes" id="regEnd" type="date" required error={errors.regEnd?.message} {...register('regEnd', { required: 'Registration close date is required.', validate: (val) => !eventDate || new Date(val) <= new Date(eventDate) || 'Registration must close before the event starts.' })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column',  gap: '1rem' }}>
          <label className="field-label">Age Calculation Rule *</label>
          <select className="field-input field-select" {...register('ageRule', { required: 'Age rule is required.' })}>
            <option value="jan1">Age as of January 1st (Event Year)</option>
            <option value="event_date">Age on exact Event Start Date</option>
          </select>
        </div>
        <Field label="Max Competitors (Capacity)" id="maxCompetitors" type="number" placeholder="Leave blank for unlimited" error={errors.maxCompetitors?.message} {...register('maxCompetitors', { min: { value: 1, message: 'Must be at least 1' } })} />
      </div>
    </div>
  )
}

// ==========================================
// STEP 2 — RULESET & TEMPLATE
// ==========================================
function StepRuleset() {
  const { register, watch, setValue } = useFormContext()
  const ruleset = watch('ruleset')
  const selectedCats = watch('categories') || []

  const ITF_CATEGORIES = ['Pattern', 'Sparring', 'Team Pattern', 'Team Sparring', 'Special Technique']
  const WT_CATEGORIES = ['Kyorugi', 'Poomsae', 'Team Poomsae', 'Freestyle Poomsae', 'Kyokpa (Breaking)']
  const allCats = ruleset === 'ITF' ? ITF_CATEGORIES : WT_CATEGORIES

  useEffect(() => {
    if (!selectedCats || selectedCats.length === 0) {
      setValue('categories', ruleset === 'ITF' ? ['Pattern', 'Sparring'] : ['Kyorugi', 'Poomsae'])
    }
  }, [ruleset, setValue, selectedCats])

  function toggleCat(cat) {
    if (selectedCats.includes(cat)) {
      setValue('categories', selectedCats.filter((c) => c !== cat), { shouldValidate: true })
    } else {
      setValue('categories', [...selectedCats, cat], { shouldValidate: true })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="box">
        <div className="section-label" style={{ marginBottom: '0.875rem' }}>Championship Ruleset</div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['ITF', 'WT'].map((rs) => (
            <label key={rs} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1.25rem', border: `1px solid ${ruleset === rs ? 'var(--gold-soft)' : 'var(--line)'}`, borderRadius: '4px', background: ruleset === rs ? 'var(--gold-deep)' : 'var(--paper-3)', cursor: 'pointer', transition: 'all 0.15s' }}>
              <input type="radio" value={rs} style={{ accentColor: 'var(--gold)' }} {...register('ruleset')} />
              <div>
                <div style={{ fontFamily: 'Saira Condensed, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{rs}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{rs === 'ITF' ? 'International Taekwon-Do Federation' : 'World Taekwondo'}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="box">
        <div className="section-label" style={{ marginBottom: '0.875rem' }}>Belt Divisions</div>
        <select className="field-input field-select" {...register('beltGrouping')}>
          <option value="all">Open to All Belts (Colour & Black Belts)</option>
          <option value="black_belt_only">Invitational: Black Belts Only</option>
          <option value="colour_belt_only">Development: Colour Belts Only</option>
        </select>
      </div>
      <div className="box">
        <div className="section-label" style={{ marginBottom: '0.875rem' }}>Event Categories / Disciplines</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {allCats.map((cat) => {
            const active = selectedCats.includes(cat)
            return (
              <button key={cat} type="button" onClick={() => toggleCat(cat)} className={`chip ${active ? 'chip-gold' : 'chip-ghost'}`} style={{ cursor: 'pointer', padding: '0.375rem 0.75rem', border: active ? undefined : '1px dashed var(--muted-2)' }}>
                {active ? '✓ ' : '+ '}{cat}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// STEP 3 — FEES & POLICY
// ==========================================
function StepFees() {
  const { register, formState: { errors } } = useFormContext()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="box">
        <div className="section-label" style={{ marginBottom: '1rem' }}>Standard Registration Fees</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Individual Fee (MYR)" id="feeIndividual" type="number" required placeholder="60" error={errors.feeIndividual?.message} {...register('feeIndividual', { required: 'Fee required.', min: 0 })} />
          <Field label="Team/Pair Fee (MYR)" id="feeTeam" type="number" required placeholder="120" error={errors.feeTeam?.message} {...register('feeTeam', { required: 'Fee required.', min: 0 })} />
        </div>
      </div>
      <div className="box">
        <div className="section-label" style={{ marginBottom: '1rem' }}>Payment Gateway Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Bank Name" id="bankName" type="text" required placeholder="e.g. Maybank" error={errors.bankName?.message} {...register('bankName', { required: 'Bank name required.' })} />
          <Field label="Account Number" id="bankAccount" type="text" autoComplete="off" required placeholder="xxxx xxxx xxxx" error={errors.bankAccount?.message} {...register('bankAccount', { required: 'Account number required.' })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <Field label="Account Name" id="bankAccountName" type="text" required placeholder="e.g. PERSATUAN TAEKWONDO ROAR" error={errors.bankAccountName?.message} {...register('bankAccountName', { required: 'Account name required.' })} />
          <Field label="Payment Reference Format" id="paymentRef" type="text" placeholder="e.g. ROAR2027-{clubCode}" hint="Use {clubCode} as a placeholder" {...register('paymentRef')} />
        </div>
      </div>
    </div>
  )
}

// ==========================================
// STEP 4 — REVIEW & PUBLISH
// ==========================================
function StepReview() {
  const { getValues } = useFormContext()
  const values = getValues()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="box">
        <div className="section-label" style={{ marginBottom: '0.875rem' }}>Final Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            ['Event Name', values.name || '—'],
            ['Ruleset', values.ruleset],
            ['Venue', values.venue || '—'],
            ['Event Date', `${values.eventDate || '—'} to ${values.eventDateEnd || '—'}`],
            ['Reg. Window', `${values.regStart || '—'} → ${values.regEnd || '—'}`],
            ['Categories', (values.categories || []).join(', ') || '—'],
            ['Standard Fees', `Indiv: MYR ${values.feeIndividual || '0'} | Team: MYR ${values.feeTeam || '0'}`],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--ink)' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// MAIN EDIT COMPONENT
// ==========================================
export default function EditEvent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)

  const methods = useForm()
  const { handleSubmit, trigger, reset, watch, formState: { isSubmitting } } = methods
  
  const eventName = watch('name')
  const currentStatus = watch('status')

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${id}`)
        if (res.ok) {
          const dbEvent = await res.json()
          
          const formatDate = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : ''

          reset({
            name: dbEvent.shortName,
            eventDate: formatDate(dbEvent.eventDate),
            eventDateEnd: formatDate(dbEvent.eventEndDate), 
            regStart: formatDate(dbEvent.created_at), 
            regEnd: formatDate(dbEvent.regCloseDate),
            venue: dbEvent.venue,
            ruleset: dbEvent.type,
            feeIndividual: dbEvent.individualFee,
            feeTeam: dbEvent.teamFee,
            beltGrouping: 'all', 
            ageRule: 'jan1',
            categories: dbEvent.type === 'ITF' ? ['Pattern', 'Sparring'] : ['Kyorugi', 'Poomsae'],
            status: dbEvent.status 
          })
        }
      } catch (err) {
        console.error("Failed to load event", err)
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [id, reset])

  async function goNext() {
    const valid = await trigger()
    if (valid) setStep((s) => Math.min(s + 1, 4))
  }

  function goPrev() {
    setStep((s) => Math.max(s - 1, 1))
  }

  const submitEdit = async (data, newStatus) => {
    try {
      const payload = { ...data, status: newStatus }
      
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        navigate('/admin')
      }
    } catch (error) {
      console.error('Network error:', error)
    }
  }

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this DRAFT? This action CANNOT be undone."
    )
    if (confirmDelete) {
      try {
        const response = await fetch(`/api/events/${id}`, { method: 'DELETE' })
        if (response.ok) {
          navigate('/admin')
        } else {
          alert('Failed to delete event.')
        }
      } catch (error) {
        console.error('Network error while deleting:', error)
      }
    }
  }

  if (loading) return <div className="wf"><TopBar /><div className="wf-main" style={{ padding: '2rem' }}>Loading event data...</div></div>

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Events', to: '/admin' }, { label: 'Edit Event' }]} />
      <div className="wf-body">
        <SideNav sections={adminTopNavSections()} />
        <div className="wf-main" style={{ maxWidth: '800px' }}>
          <PageHead title="Edit Event" sub={eventName ? `Updating: ${eventName}` : 'Loading...'} />
          <StepBar current={step} />

          <FormProvider {...methods}>
            <form noValidate>
              <div className="box" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
                <div className="section-label" style={{ marginBottom: '1.5rem', color: 'var(--gold)', fontSize: '1rem' }}>
                  Step {step} — {STEPS[step - 1].label}
                </div>
                {step === 1 && <StepBasics />}
                {step === 2 && <StepRuleset />}
                {step === 3 && <StepFees />}
                {step === 4 && <StepReview />}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {step > 1 ? (
                    <Btn variant="ghost" type="button" onClick={goPrev}>← Back</Btn>
                  ) : (
                    <Btn variant="ghost" type="button" onClick={() => navigate('/admin')}>Cancel</Btn>
                  )}
                  
                  {/* SAFE DELETE: Only renders if the event is a DRAFT */}
                  {currentStatus === 'DRAFT' && step === 1 && (
                    <button 
                      type="button" 
                      onClick={handleDelete}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', padding: '0.5rem 1rem', fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      Delete Draft
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {step < 4 ? (
                    <Btn variant="primary" type="button" onClick={goNext}>Next: {STEPS[step].label} →</Btn>
                  ) : currentStatus === 'DRAFT' ? (
                    <>
                      {/* DRAFT BUTTONS */}
                      <Btn variant="ghost" type="button" onClick={handleSubmit((data) => submitEdit(data, 'DRAFT'))} disabled={isSubmitting}>
                        Save Draft
                      </Btn>
                      <Btn variant="primary" type="button" onClick={handleSubmit((data) => submitEdit(data, 'PUBLISHED'))} disabled={isSubmitting}>
                        {isSubmitting ? 'Publishing…' : 'Publish Event'}
                      </Btn>
                    </>
                  ) : (
                    <>
                      {/* PUBLISHED EVENT BUTTONS (Safety net) */}
                      <Btn variant="ghost" type="button" onClick={handleSubmit((data) => submitEdit(data, 'CANCELLED'))} disabled={isSubmitting}>
                        Cancel Event
                      </Btn>
                      <Btn variant="primary" type="button" onClick={handleSubmit((data) => submitEdit(data, 'PUBLISHED'))} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving…' : 'Save Changes'}
                      </Btn>
                    </>
                  )}
                </div>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  )
}