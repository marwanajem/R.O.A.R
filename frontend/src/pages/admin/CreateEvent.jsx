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
            <option value="year_of_birth">Event Year - Year of Birth = Age (Standard)</option>
            <option value="exact_date">Exact Age on Event Start Date</option>
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

  // NEW: Added 'Pair Pattern' and 'Pair Poomsae' to the arrays
  const ITF_CATEGORIES = ['Pattern', 'Sparring', 'Team Pattern', 'Pair Pattern', 'Team Sparring', 'Special Technique']
  const WT_CATEGORIES = ['Kyorugi', 'Poomsae', 'Team Poomsae', 'Pair Poomsae', 'Freestyle Poomsae', 'Kyokpa (Breaking)']
  
  const allCats = ruleset === 'ITF' ? ITF_CATEGORIES : WT_CATEGORIES

  // Auto-switch categories when ruleset changes (smart prevention of overwriting)
  useEffect(() => {
    const hasCurrentRulesetCats = selectedCats.some(c => allCats.includes(c))
    if (!hasCurrentRulesetCats) {
      setValue('categories', ruleset === 'ITF' ? ['Pattern', 'Sparring'] : ['Kyorugi', 'Poomsae'])
    }
  }, [ruleset, setValue, allCats, selectedCats])

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
  const { register, formState: { errors }, watch, setValue, getValues } = useFormContext()
  
  const categories = watch('categories') || []

  // Auto-clean removed categories from the fees object to prevent zombie data saving to the DB
  useEffect(() => {
    const currentFees = getValues('fees') || {}
    const validFees = {}
    
    categories.forEach(cat => {
      // Keep existing value if it exists, otherwise initialize as empty string
      validFees[cat] = currentFees[cat] !== undefined ? currentFees[cat] : ''
    })
    
    // Check if we need to update the form state (i.e., categories were added/removed)
    const currentKeys = Object.keys(currentFees)
    const needsUpdate = currentKeys.length !== categories.length || !categories.every(c => currentKeys.includes(c))
    
    if (needsUpdate) {
      setValue('fees', validFees, { shouldValidate: true })
    }
  }, [categories, setValue, getValues])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div className="box">
        <div className="section-label" style={{ marginBottom: '1rem' }}>Category Registration Fees</div>
        
        {categories.length === 0 ? (
          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', padding: '1rem', background: 'var(--paper-2)', borderRadius: '4px', textAlign: 'center' }}>
            Please select at least one Event Category in Step 2 to configure fees.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {categories.map(cat => {
              const isTeam = cat.toLowerCase().includes('team') || cat.toLowerCase().includes('pair')
              return (
                <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <Field 
                    label={`${cat} Fee (MYR)`} 
                    id={`fees.${cat}`} 
                    type="number" 
                    required 
                    placeholder={isTeam ? "120" : "60"} 
                    error={errors.fees?.[cat]?.message} 
                    {...register(`fees.${cat}`, { required: 'Fee required.', min: 0 })} 
                  />
                </div>
              )
            })}
          </div>
        )}
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

  // Format the fees into a clean, stacked list rather than a long string
  const formattedFees = values.fees && Object.keys(values.fees).length > 0 ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
      {Object.entries(values.fees).map(([cat, fee]) => (
        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '220px', borderBottom: '1px dashed var(--line)', paddingBottom: '2px' }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>{cat}</span>
          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--ink)' }}>MYR {fee || '0'}</span>
        </div>
      ))}
    </div>
  ) : 'N/A'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="box">
        <div className="section-label" style={{ marginBottom: '0.875rem' }}>Final Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {[
            ['Event Name', values.name || '—'],
            ['Ruleset', values.ruleset],
            ['Venue', values.venue || '—'],
            ['Event Date', `${values.eventDate || '—'} to ${values.eventDateEnd || '—'}`],
            ['Reg. Window', `${values.regStart || '—'} → ${values.regEnd || '—'}`],
            ['Categories', (values.categories || []).join(', ') || '—'],
            ['Belt Rule', values.beltGrouping?.replace(/_/g, ' ').toUpperCase() || '—'],
            ['Category Fees', formattedFees],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: '3px' }}>{label}</div>
              {/* Allow val to render standard text OR our new React node for the fees */}
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
  
  // Persist the current step to prevent resets
  const initialStep = parseInt(sessionStorage.getItem('createEventStep'), 10) || 1
  const [step, setStep] = useState(initialStep)

  useEffect(() => {
    sessionStorage.setItem('createEventStep', step)
  }, [step])

  // Retrieve draft data to prevent form resets on screen lock/reload
  const savedDraft = JSON.parse(sessionStorage.getItem('createEventDraft') || '{}')

  // Initialize react-hook-form
  const methods = useForm({
    defaultValues: { 
      ruleset: 'ITF', 
      categories: ['Pattern', 'Sparring'],
      beltGrouping: 'all',
      ageRule: 'year_of_birth',
      ...savedDraft
    }
  })

  const { handleSubmit, trigger, formState: { isSubmitting }, watch } = methods

  // Save the form continuously to sessionStorage as it changes
  useEffect(() => {
    const subscription = watch((value) => {
      sessionStorage.setItem('createEventDraft', JSON.stringify(value))
    })
    return () => subscription.unsubscribe()
  }, [watch])

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
      const payload = { ...data, status }
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Clear drafts on successful submit
        sessionStorage.removeItem('createEventDraft')
        sessionStorage.removeItem('createEventStep')
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
                    <Btn variant="ghost" type="button" onClick={() => {
                      sessionStorage.removeItem('createEventDraft');
                      sessionStorage.removeItem('createEventStep');
                      navigate('/admin');
                    }}>Cancel</Btn>
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