import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Field from '../../components/ui/Field'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
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
              <div className="step-num">
                {step.num < current ? '✓' : step.num}
              </div>
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
      <Field
        label="Event Name"
        id="name"
        type="text"
        required
        placeholder="e.g. ROAR Open Championship 2027"
        error={errors.name?.message}
        {...register('name', { required: 'Event name is required.' })}
      />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field
          label="Event Date (Start)"
          id="eventDate"
          type="date"
          required
          error={errors.eventDate?.message}
          {...register('eventDate', { required: 'Event start date is required.' })}
        />
        <Field
          label="Event Date (End)"
          id="eventDateEnd"
          type="date"
          error={errors.eventDateEnd?.message}
          {...register('eventDateEnd')}
        />
      </div>

      <Field
        label="Venue"
        id="venue"
        type="text"
        required
        placeholder="e.g. Stadium Putra Bukit Jalil, Kuala Lumpur"
        error={errors.venue?.message}
        {...register('venue', { required: 'Venue is required.' })}
      />

      <hr className="divider" style={{ margin: '0.5rem 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field
          label="Registration Opens"
          id="regStart"
          type="date"
          required
          error={errors.regStart?.message}
          {...register('regStart', { required: 'Registration open date is required.' })}
        />
        <Field
          label="Registration Closes"
          id="regEnd"
          type="date"
          required
          error={errors.regEnd?.message}
          {...register('regEnd', { 
            required: 'Registration close date is required.',
            validate: (val) => !eventDate || new Date(val) <= new Date(eventDate) || 'Registration must close before the event starts.'
          })}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap:"1rem"}}>
          <label className="field-label">Age Calculation Rule *</label>
          <select className="field-input field-select" {...register('ageRule', { required: 'Age rule is required.' })}>
            <option value="jan1">Age as of January 1st (Event Year)</option>
            <option value="event_date">Age on exact Event Start Date</option>
          </select>
        </div>
        <Field
          label="Max Competitors (Capacity)"
          id="maxCompetitors"
          type="number"
          placeholder="Leave blank for unlimited"
          error={errors.maxCompetitors?.message}
          {...register('maxCompetitors', { min: { value: 1, message: 'Must be at least 1' } })}
        />
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

  // Auto-switch categories when ruleset changes
  useEffect(() => {
    setValue('categories', ruleset === 'ITF' ? ['Pattern', 'Sparring'] : ['Kyorugi', 'Poomsae'])
  }, [ruleset, setValue])

  function toggleCat(cat) {
    if (selectedCats.includes(cat)) {
      setValue('categories', selectedCats.filter((c) => c !== cat), { shouldValidate: true })
    } else {
      setValue('categories', [...selectedCats, cat], { shouldValidate: true })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Ruleset selector */}
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

      {/* Belt Groupings */}
      <div className="box">
        <div className="section-label" style={{ marginBottom: '0.875rem' }}>Belt Divisions</div>
        <select className="field-input field-select" {...register('beltGrouping')}>
          <option value="all">Open to All Belts (Colour & Black Belts)</option>
          <option value="black_belt_only">Invitational: Black Belts Only</option>
          <option value="colour_belt_only">Development: Colour Belts Only</option>
        </select>
      </div>

      {/* Categories */}
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

      <div style={{ background: 'var(--paper-3)', border: '1px solid var(--gold-deep)', borderRadius: '4px', padding: '0.875rem 1rem', display: 'flex', gap: '0.625rem' }}>
        <span style={{ color: 'var(--gold)', fontSize: '0.875rem', flexShrink: 0 }}>ℹ</span>
        <p style={{ fontSize: '0.8125rem', color: 'var(--ink-2)', margin: 0 }}>
          Using <strong style={{ color: 'var(--gold)' }}>{ruleset} Standard Template</strong>. Weight classes and age divisions will be pre-populated. You can override them in the Category Overrides tab after publishing.
        </p>
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
          <Field 
            label="Individual Fee (MYR)" 
            id="feeIndividual" 
            type="number" 
            required 
            placeholder="60" 
            error={errors.feeIndividual?.message} 
            {...register('feeIndividual', { required: 'Fee required.', min: 0 })} 
          />
          <Field 
            label="Team/Pair Fee (MYR)" 
            id="feeTeam" 
            type="number" 
            required 
            placeholder="120" 
            error={errors.feeTeam?.message} 
            {...register('feeTeam', { required: 'Fee required.', min: 0 })} 
          />
        </div>
      </div>

      <div className="box">
        <div className="section-label" style={{ marginBottom: '1rem' }}>Payment Gateway Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field 
            label="Bank Name" 
            id="bankName" 
            type="text" 
            required 
            placeholder="e.g. Maybank" 
            error={errors.bankName?.message} 
            {...register('bankName', { required: 'Bank name required.' })} 
          />
          <Field 
            label="Account Number" 
            id="bankAccount" 
            type="text" 
            autoComplete="off" 
            required 
            placeholder="xxxx xxxx xxxx" 
            error={errors.bankAccount?.message} 
            {...register('bankAccount', { required: 'Account number required.' })} 
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <Field 
            label="Account Name" 
            id="bankAccountName" 
            type="text" 
            required 
            placeholder="e.g. PERSATUAN TAEKWONDO ROAR" 
            error={errors.bankAccountName?.message} 
            {...register('bankAccountName', { required: 'Account name required.' })} 
          />
          <Field 
            label="Payment Reference Format" 
            id="paymentRef" 
            type="text" 
            placeholder="e.g. ROAR2027-{clubCode}" 
            hint="Use {clubCode} as a placeholder" 
            {...register('paymentRef')} 
          />
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
            ['Belt Rule', values.beltGrouping?.replace(/_/g, ' ').toUpperCase() || '—'],
            ['Standard Fees', `Indiv: MYR ${values.feeIndividual || '0'} | Team: MYR ${values.feeTeam || '0'}`],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--ink)' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--paper-3)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '0.875rem 1rem', display: 'flex', gap: '0.625rem' }}>
        <span style={{ color: 'var(--gold)', fontSize: '0.875rem', flexShrink: 0 }}>ℹ</span>
        <p style={{ fontSize: '0.8125rem', color: 'var(--ink-2)', margin: 0 }}>
          <strong>Drafts</strong> remain hidden from Team Managers. <strong>Publishing</strong> will make this event visible immediately as 'Upcoming' until the registration date opens.
        </p>
      </div>
    </div>
  )
}

// ==========================================
// MAIN WIZARD CONTAINER
// ==========================================
export default function CreateEvent() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // Initialize react-hook-form
  const methods = useForm({
    defaultValues: { 
      ruleset: 'ITF', 
      categories: ['Pattern', 'Sparring'],
      beltGrouping: 'all',
      ageRule: 'jan1'
    }
  })

  const { handleSubmit, trigger, formState: { isSubmitting } } = methods

  async function goNext() {
    // Validate only the current step's fields before allowing progress
    const valid = await trigger()
    if (valid) setStep((s) => Math.min(s + 1, 4))
  }

  function goPrev() {
    setStep((s) => Math.max(s - 1, 1))
  }

  const submitEvent = async (data, status) => {
    try {
      // Append the explicitly chosen status (DRAFT or PUBLISHED)
      const payload = { ...data, status }
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        navigate('/admin')
      } else {
        console.error('Failed to create event.')
      }
    } catch (error) {
      console.error('Network error:', error)
    }
  }

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Events', to: '/admin' }, { label: 'Create Event' }]} />
      
      <div className="wf-body">
        <SideNav sections={adminTopNavSections()} />
        <div className="wf-main" style={{ maxWidth: '800px' }}>
          <PageHead title="Create Event" sub="4-step wizard — set up a new championship" />

          <StepBar current={step} />

          {/* Wrap the form in FormProvider to supply context to all nested steps */}
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
                <div>
                  {step > 1 ? (
                    <Btn variant="ghost" type="button" onClick={goPrev}>← Back</Btn>
                  ) : (
                    <Btn variant="ghost" type="button" onClick={() => navigate('/admin')}>Cancel</Btn>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {step < 4 ? (
                    <Btn variant="primary" type="button" onClick={goNext}>
                      Next: {STEPS[step].label} →
                    </Btn>
                  ) : (
                    <>
                      <Btn variant="ghost" type="button" onClick={handleSubmit((data) => submitEvent(data, 'DRAFT'))} disabled={isSubmitting}>
                        Save as Draft
                      </Btn>
                      <Btn variant="primary" type="button" onClick={handleSubmit((data) => submitEvent(data, 'PUBLISHED'))} disabled={isSubmitting}>
                        {isSubmitting ? 'Publishing…' : 'Publish Event'}
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