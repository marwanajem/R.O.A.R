import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Field from '../../components/ui/Field'
import SelectField from '../../components/ui/SelectField'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import { adminTopNavSections } from '../../utils/navSections'

const STEPS = [
  { num: 1, label: 'Basics' },
  { num: 2, label: 'Ruleset & Template' },
  { num: 3, label: 'Fees & Policy' },
  { num: 4, label: 'Review & Publish' },
]

function StepBar({ current }) {
  return (
    <div className="step-bar">
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

// Step 1 — Basics
function StepBasics({ register, errors }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Field
        label="Event Name"
        name="name"
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
          name="eventDate"
          id="eventDate"
          type="date"
          required
          error={errors.eventDate?.message}
          {...register('eventDate', { required: 'Event start date is required.' })}
        />
        <Field
          label="Event Date (End)"
          name="eventDateEnd"
          id="eventDateEnd"
          type="date"
          error={errors.eventDateEnd?.message}
          {...register('eventDateEnd')}
        />
      </div>
      <Field
        label="Venue"
        name="venue"
        id="venue"
        type="text"
        required
        placeholder="e.g. Stadium Putra Bukit Jalil, Kuala Lumpur"
        error={errors.venue?.message}
        {...register('venue', { required: 'Venue is required.' })}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field
          label="Registration Opens"
          name="regStart"
          id="regStart"
          type="date"
          required
          error={errors.regStart?.message}
          {...register('regStart', { required: 'Registration open date is required.' })}
        />
        <Field
          label="Registration Closes"
          name="regEnd"
          id="regEnd"
          type="date"
          required
          error={errors.regEnd?.message}
          {...register('regEnd', { required: 'Registration close date is required.' })}
        />
      </div>
    </div>
  )
}

// Step 2 — Ruleset & Template (MAIN DEMO SCREEN)
function StepRuleset({ register, errors, watch }) {
  const ruleset = watch('ruleset') || 'ITF'
  const ITF_CATEGORIES = ['Pattern', 'Sparring', 'Team Pattern', 'Team Sparring', 'Pair Pattern']
  const WT_CATEGORIES = ['Kyorugi', 'Poomsae', 'Team Poomsae', 'Freestyle Poomsae']

  const [selectedCats, setSelectedCats] = useState(
    ruleset === 'ITF' ? [...ITF_CATEGORIES] : [...WT_CATEGORIES]
  )

  const allCats = ruleset === 'ITF' ? ITF_CATEGORIES : WT_CATEGORIES

  function toggleCat(cat) {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const ITF_AGE_GROUPS = ['U8', '9-11', '12-14', '15-17', '18+']
  const WT_AGE_GROUPS = ['Cadet (14-17)', 'Junior (15-17)', 'Senior (18+)', 'Veteran (45+)']
  const ageGroups = ruleset === 'ITF' ? ITF_AGE_GROUPS : WT_AGE_GROUPS

  const ITF_BELT_GROUPS = [
    { code: 'CB', label: 'Colour Belt (8G–5G)' },
    { code: 'CB-low', label: 'Colour Belt Low (4G–1G)' },
    { code: 'BB', label: 'Black Belt (1D–3D)' },
    { code: 'BB-senior', label: 'Black Belt Senior (4D–6D)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Ruleset selector */}
      <div className="box">
        <div className="section-label" style={{ marginBottom: '0.875rem' }}>
          Championship Ruleset
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['ITF', 'WT'].map((rs) => (
            <label
              key={rs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.75rem 1.25rem',
                border: `1px solid ${watch('ruleset') === rs || (!watch('ruleset') && rs === 'ITF') ? 'var(--gold-soft)' : 'var(--line)'}`,
                borderRadius: '4px',
                background: watch('ruleset') === rs || (!watch('ruleset') && rs === 'ITF') ? 'var(--gold-deep)' : 'var(--paper-3)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                value={rs}
                defaultChecked={rs === 'ITF'}
                style={{ accentColor: 'var(--gold)' }}
                {...register('ruleset', { required: true })}
              />
              <div>
                <div style={{ fontFamily: 'Saira Condensed, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {rs}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {rs === 'ITF' ? 'International Taekwon-Do Federation' : 'World Taekwondo'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="box">
        <div className="section-label" style={{ marginBottom: '0.875rem' }}>
          Event Categories
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {allCats.map((cat) => {
            const active = selectedCats.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCat(cat)}
                className={`chip ${active ? 'chip-gold' : 'chip-ghost'}`}
                style={{ cursor: 'pointer', padding: '0.375rem 0.75rem', border: active ? undefined : '1px dashed var(--muted-2)' }}
              >
                {active ? '✓ ' : '+ '}{cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Age groups */}
      <div className="box">
        <div className="section-label" style={{ marginBottom: '0.875rem' }}>
          Age Groups
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {ageGroups.map((ag) => (
            <Chip key={ag} variant="default">{ag}</Chip>
          ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.625rem' }}>
          Age groups are determined by the {ruleset} ruleset template and event year. Individual overrides available in Categories tab.
        </p>
      </div>

      {/* Belt groups */}
      {ruleset === 'ITF' && (
        <div className="box">
          <div className="section-label" style={{ marginBottom: '0.875rem' }}>
            Belt Groups (ITF)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {ITF_BELT_GROUPS.map((bg) => (
              <div key={bg.code} className="box-slot" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Chip variant="gold">{bg.code}</Chip>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>{bg.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template note */}
      <div style={{ background: 'var(--paper-3)', border: '1px solid var(--gold-deep)', borderRadius: '4px', padding: '0.875rem 1rem', display: 'flex', gap: '0.625rem' }}>
        <span style={{ color: 'var(--gold)', fontSize: '0.875rem', flexShrink: 0 }}>ℹ</span>
        <p style={{ fontSize: '0.8125rem', color: 'var(--ink-2)', margin: 0 }}>
          Using <strong style={{ color: 'var(--gold)' }}>{ruleset} Standard Template</strong>. Weight classes and sparring divisions will be pre-populated from the ruleset defaults. You can override individual categories in Step 3 or after publishing via the Categories tab.
        </p>
      </div>
    </div>
  )
}

// Step 3 — Fees & Policy
function StepFees({ register, errors }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <Field
          label="Individual Fee (MYR)"
          name="feeIndividual"
          id="feeIndividual"
          type="number"
          inputMode="numeric"
          required
          placeholder="60"
          error={errors.feeIndividual?.message}
          {...register('feeIndividual', { required: 'Fee required.', min: { value: 0, message: 'Cannot be negative.' } })}
        />
        <Field
          label="Team Fee (MYR)"
          name="feeTeam"
          id="feeTeam"
          type="number"
          inputMode="numeric"
          required
          placeholder="120"
          error={errors.feeTeam?.message}
          {...register('feeTeam', { required: 'Fee required.', min: { value: 0, message: 'Cannot be negative.' } })}
        />
        <Field
          label="Pair Fee (MYR)"
          name="feePair"
          id="feePair"
          type="number"
          inputMode="numeric"
          required
          placeholder="80"
          error={errors.feePair?.message}
          {...register('feePair', { required: 'Fee required.', min: { value: 0, message: 'Cannot be negative.' } })}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field
          label="Bank Name"
          name="bankName"
          id="bankName"
          type="text"
          required
          placeholder="e.g. Maybank"
          error={errors.bankName?.message}
          {...register('bankName', { required: 'Bank name required.' })}
        />
        <Field
          label="Account Number"
          name="bankAccount"
          id="bankAccount"
          type="text"
          autoComplete="off"
          required
          placeholder="xxxx xxxx xxxx"
          error={errors.bankAccount?.message}
          {...register('bankAccount', { required: 'Account number required.' })}
        />
      </div>
      <Field
        label="Account Name"
        name="bankAccountName"
        id="bankAccountName"
        type="text"
        required
        placeholder="e.g. PERSATUAN TAEKWONDO ROAR"
        error={errors.bankAccountName?.message}
        {...register('bankAccountName', { required: 'Account name required.' })}
      />
      <Field
        label="Payment Reference Format"
        name="paymentRef"
        id="paymentRef"
        type="text"
        placeholder="e.g. ROAR2027-{clubCode}"
        hint="Use {clubCode} as a placeholder — it will be replaced with each club's code"
        {...register('paymentRef')}
      />
    </div>
  )
}

// Step 4 — Review
function StepReview({ getValues }) {
  const values = getValues()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="box">
        <div className="section-label" style={{ marginBottom: '0.875rem' }}>
          Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            ['Event Name', values.name || '—'],
            ['Ruleset', values.ruleset || 'ITF'],
            ['Venue', values.venue || '—'],
            ['Event Date', values.eventDate || '—'],
            ['Reg. Window', `${values.regStart || '—'} → ${values.regEnd || '—'}`],
            ['Individual Fee', values.feeIndividual ? `MYR ${values.feeIndividual}` : '—'],
            ['Team Fee', values.feeTeam ? `MYR ${values.feeTeam}` : '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--ink)' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: 'var(--paper-3)', border: '1px solid var(--ok)', borderRadius: '4px', padding: '0.875rem 1rem', display: 'flex', gap: '0.625rem' }}>
        <span style={{ color: 'var(--ok)', fontSize: '0.875rem', flexShrink: 0 }}>✓</span>
        <p style={{ fontSize: '0.8125rem', color: 'var(--ink-2)', margin: 0 }}>
          Ready to publish. Event will appear as <strong style={{ color: 'var(--gold)' }}>Upcoming</strong> until the registration window opens.
        </p>
      </div>
    </div>
  )
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { ruleset: 'ITF' } })

  async function goNext() {
    const valid = await trigger()
    if (valid) setStep((s) => Math.min(s + 1, 4))
  }

  function goPrev() {
    setStep((s) => Math.max(s - 1, 1))
  }

  const onSubmit = async (data) => {
    console.info('Create event payload (ready for API):', data)
    navigate('/admin')
  }

  return (
    <div className="wf">
      <TopBar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Events', to: '/admin' },
          { label: 'Create Event' },
        ]}
      />
      <div className="wf-body">
        <SideNav sections={adminTopNavSections()} />
        <div className="wf-main" style={{ maxWidth: '760px' }}>
        <PageHead title="Create Event" sub="4-step wizard — set up a new championship" />

        <StepBar current={step} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="box" style={{ marginBottom: '1rem' }}>
            <div className="section-label" style={{ marginBottom: '1.25rem' }}>
              Step {step} — {STEPS[step - 1].label}
            </div>

            {step === 1 && <StepBasics register={register} errors={errors} />}
            {step === 2 && <StepRuleset register={register} errors={errors} watch={watch} />}
            {step === 3 && <StepFees register={register} errors={errors} />}
            {step === 4 && <StepReview getValues={getValues} />}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div>
              {step > 1 && (
                <Btn variant="ghost" type="button" onClick={goPrev}>
                  ← Back
                </Btn>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Btn variant="ghost" type="button" onClick={() => navigate('/admin')}>
                Cancel
              </Btn>
              {step < 4 ? (
                <Btn variant="primary" type="button" onClick={goNext}>
                  Next: {STEPS[step].label} →
                </Btn>
              ) : (
                <Btn variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Publishing…' : 'Publish Event'}
                </Btn>
              )}
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
