import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Field from '../../components/ui/Field'
import SelectField from '../../components/ui/SelectField'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import { deriveAll } from '../../utils/categoryRules'
import { BELT_GRADES } from '../../utils/beltGrades'
import { tmNavSections } from '../../utils/navSections'
import { useAuth } from '../../contexts/AuthContext'

const IC_REGEX = /^\d{6}-\d{2}-(?:\d{4}|XXXX)$/i

function DerivationPanel({ derived }) {
  const { age, ageCategory, beltGroup, patternFormat, weightClass } = derived
  const items = [
    { label: 'Age (Event Year)', value: age != null ? `${age} yrs` : null, variant: 'default' },
    { label: 'Age Category',     value: ageCategory,  variant: 'gold' },
    { label: 'Belt Group',       value: beltGroup,    variant: 'ok' },
    { label: 'Pattern Format',   value: patternFormat, variant: patternFormat === 'Carnival' ? 'warn' : patternFormat === 'None' ? 'default' : 'ghost' },
    { label: 'Sparring Weight Class', value: weightClass, variant: weightClass === 'None' ? 'default' : 'default' },
  ]
  return (
    <div className="box-fill" style={{ position: 'sticky', top: '1.5rem' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1rem' }}>
        Auto-Derived Categories
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {items.map(({ label, value, variant }) => (
          <div key={label}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: '0.25rem' }}>
              {label}
            </div>
            {value
              ? <Chip variant={variant}>{value}</Chip>
              : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--muted-2)' }}>—</span>
            }
          </div>
        ))}
      </div>
      <hr className="divider" />
      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.6 }}>
        Categories are auto-assigned from ITF rules. Manual overrides require Super Admin approval.
      </p>
    </div>
  )
}

export default function EditCompetitor() {
  const { id, cid } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    reset, 
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { isSparring: true, isPattern: true } // Default both to true
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await fetch(`/api/events/${id}`)
        if (eventRes.ok) setEvent(await eventRes.json())

        if (user?.clubCode) {
          // FIXED: Added the leading slash to /api/...
          const rosterRes = await fetch(`/api/competitors/event/${id}/club/${user.clubCode}`)
          if (rosterRes.ok) {
            const rosterData = await rosterRes.json()
            const comp = rosterData.find((c) => c.id.toString() === cid)
            
            if (comp) {
              // FIXED: Format the date string to YYYY-MM-DD for the HTML input
              const formattedDate = comp.dob ? comp.dob.split('T')[0] : '';
              
              reset({
                fullName: comp.fullName,
                icNumber: comp.icMasked,
                dob: formattedDate,
                gender: comp.gender,
                beltGrade: comp.beltGrade,
                weightKg: comp.weightKg,
                
                isSparring: comp.isSparring !== undefined ? comp.isSparring : comp.weightCategory !== 'None',
                isPattern: comp.isPattern !== undefined ? comp.isPattern : comp.patternFormat !== 'None',
              })
            }
          }
        }
      } catch (error) {
        console.error('Failed to load competitor data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, cid, user?.clubCode, reset])

  const dob        = watch('dob')
  const beltGrade  = watch('beltGrade')
  const gender     = watch('gender')
  const weightKg   = watch('weightKg')
  const isSparring = watch('isSparring')
  const isPattern  = watch('isPattern')

  // Calculate derivations, then override with 'None' if the TM unchecked the box
  let derived = deriveAll({ dob, beltGrade, gender, weightKg: parseFloat(weightKg) })
  if (!isSparring) derived.weightClass = 'None'
  if (!isPattern) derived.patternFormat = 'None'

  if (loading) {
    return <div className="wf"><TopBar /><div className="wf-main"><p style={{ color: 'var(--muted)', padding: '2rem' }}>Loading competitor...</p></div></div>
  }

  const onSubmit = async (data) => {
    // Validation: Must select at least one event
    if (!data.isSparring && !data.isPattern) {
      alert("A competitor must be entered into at least one event (Sparring or Pattern).")
      return;
    }

    try {
      const payload = {
        fullName: data.fullName,
        icMasked: data.icNumber.includes('X') ? data.icNumber : data.icNumber.substring(0, 10) + 'XXXX',
        dob: data.dob,
        gender: data.gender,
        beltGrade: data.beltGrade,
        ageCategory: derived.ageCategory,
        beltGroup: derived.beltGroup,
        weightKg: parseFloat(data.weightKg),
        weightCategory: derived.weightClass,
        patternFormat: derived.patternFormat,
        isSparring: data.isSparring,
        isPattern: data.isPattern
      }

      const response = await fetch(`/api/competitors/${cid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to update competitor')
      navigate(`/events/${id}/competitors`)
      
    } catch (error) {
      console.error('Submission error:', error)
      alert('There was a problem updating the competitor.')
    }
  }

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Events', to: '/events' }, { label: event?.shortName || id, to: `/events/${id}` }, { label: 'Competitors', to: `/events/${id}/competitors` }, { label: 'Edit' }]} />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        <SideNav sections={tmNavSections(id, event?.type)} />
        <main className="wf-main">
          <PageHead title="Edit Competitor" sub="Update details as they appear on IC / Birth Certificate" />

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
              <div className="box" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Field 
                    label="Full Name (as on IC / BC)" 
                    name="fullName" 
                    id="fullName" 
                    type="text" 
                    autoComplete="name" 
                    required 
                    error={errors.fullName?.message} 
                    {...register('fullName', { 
                      required: 'Full name is required.', 
                      minLength: { value: 3, message: 'Name too short.' }, 
                      maxLength: { value: 120, message: 'Name too long.' },
                      pattern: {
                        value: /^[a-zA-Z\s\-'.@]+$/,
                        message: 'Name cannot contain numbers or special symbols.'
                      }
                    })} 
                  />
                <Field label="IC / BC Number" name="icNumber" id="icNumber" type="text" autoComplete="off" required error={errors.icNumber?.message} {...register('icNumber', { required: 'IC is required.', pattern: { value: IC_REGEX, message: 'Format YYMMDD-PP-ZZZG' } })} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label="Date of Birth" name="dob" id="dob" type="date" required error={errors.dob?.message} {...register('dob', { required: 'DOB is required.' })} />
                  <SelectField label="Gender" name="gender" id="gender" required error={errors.gender?.message} {...register('gender')}>
                    <option value="M">Male</option><option value="F">Female</option>
                  </SelectField>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <SelectField label="Belt Grade" name="beltGrade" id="beltGrade" required error={errors.beltGrade?.message} {...register('beltGrade')}>
                    {BELT_GRADES.map((b) => <option key={b.value} value={b.value}>{b.value} — {b.label}</option>)}
                  </SelectField>
                  <Field 
                    label="Weight (kg)" 
                    name="weightKg" 
                    id="weightKg" 
                    type="number" 
                    inputMode="decimal" 
                    autoComplete="off" 
                    required 
                    hint="Official weigh-in weight" 
                    error={errors.weightKg?.message} 
                    {...register('weightKg', { 
                      required: 'Weight is required.',
                      validate: {
                        isValid: (v) => !isNaN(parseFloat(v)) || 'Enter a valid number.',
                        isHeavyEnough: (v) => parseFloat(v) >= 10 || 'Minimum weight is 10 kg.',
                        isLightEnough: (v) => parseFloat(v) <= 200 || 'Maximum weight is 200 kg.'
                      }
                    })} 
                  />
                </div>

                <hr className="divider" />

                {/* NEW: Event Toggles */}
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                    Events Entered
                  </div>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" {...register('isSparring')} style={{ width: '16px', height: '16px', accentColor: 'var(--gold)' }} />
                      <span style={{ fontSize: '0.875rem' }}>Sparring (Kyorugi)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" {...register('isPattern')} style={{ width: '16px', height: '16px', accentColor: 'var(--gold)' }} />
                      <span style={{ fontSize: '0.875rem' }}>Pattern (Poomsae)</span>
                    </label>
                  </div>
                </div>

                <hr className="divider" />

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <Btn variant="ghost" type="button" onClick={() => navigate(`/events/${id}/competitors`)}>Cancel</Btn>
                  <Btn variant="primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Save Changes'}
                  </Btn>
                </div>
              </div>

              <DerivationPanel derived={derived} />
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}