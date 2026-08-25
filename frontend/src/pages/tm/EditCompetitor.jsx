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

// Updated REGEX to accept either 4 numbers OR 'XXXX' at the end for masked ICs
const IC_REGEX = /^\d{6}-\d{2}-(?:\d{4}|XXXX)$/i

function DerivationPanel({ derived }) {
  const { age, ageCategory, beltGroup, patternFormat, weightClass } = derived
  const items = [
    { label: 'Age (Event Year)', value: age != null ? `${age} yrs` : null, variant: 'default' },
    { label: 'Age Category',     value: ageCategory,  variant: 'gold' },
    { label: 'Belt Group',       value: beltGroup,    variant: 'ok' },
    { label: 'Pattern Format',   value: patternFormat, variant: patternFormat === 'Carnival' ? 'warn' : 'ghost' },
    { label: 'Sparring Weight Class', value: weightClass, variant: 'default' },
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
  } = useForm()

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await fetch(`/api/auth/login/api/events/${id}`)
        if (eventRes.ok) setEvent(await eventRes.json())

        if (user?.clubCode) {
          const rosterRes = await fetch(`/api/auth/login/api/competitors/event/${id}/club/${user.clubCode}`)
          if (rosterRes.ok) {
            const rosterData = await rosterRes.json()
            
            const comp = rosterData.find((c) => c.id.toString() === cid)
            
            if (comp) {
            
              reset({
                fullName: comp.fullName,
                icNumber: comp.icMasked,
                dob: comp.dob,
                gender: comp.gender,
                beltGrade: comp.beltGrade,
                weightKg: comp.weightKg,
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

  const dob       = watch('dob')
  const beltGrade = watch('beltGrade')
  const gender    = watch('gender')
  const weightKg  = watch('weightKg')
  const derived   = deriveAll({ dob, beltGrade, gender, weightKg: parseFloat(weightKg) })

  if (loading) {
    return (
      <div className="wf">
        <TopBar />
        <div className="wf-main"><p style={{ color: 'var(--muted)', padding: '2rem' }}>Loading competitor...</p></div>
      </div>
    )
  }

  const onSubmit = async (data) => {
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
        patternFormat: derived.patternFormat
      }

      
      const response = await fetch(`/api/auth/login/api/competitors/${cid}`, {
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
      <TopBar
        breadcrumbs={[
          { label: 'Events', to: '/events' },
          { label: event?.shortName || id, to: `/events/${id}` },
          { label: 'Competitors', to: `/events/${id}/competitors` },
          { label: 'Edit' },
        ]}
      />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        <SideNav sections={tmNavSections(id)} />
        <main className="wf-main">
          <PageHead title="Edit Competitor" sub="Update details as they appear on IC / Birth Certificate" />

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
              <div className="box" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Field
                  label="Full Name (as on IC / BC)"
                  name="fullName" id="fullName" type="text" autoComplete="name" required
                  placeholder="e.g. Ahmad Faris bin Zulkifli"
                  error={errors.fullName?.message}
                  {...register('fullName', {
                    required: 'Full name is required.',
                    minLength: { value: 3, message: 'Name too short.' },
                    maxLength: { value: 120, message: 'Name too long (max 120 chars).' },
                  })}
                />

                <Field
                  label="IC / BC Number"
                  name="icNumber" id="icNumber" type="text" autoComplete="off" required
                  placeholder="e.g. 031204-14-5521"
                  hint="Format: YYMMDD-PP-ZZZG"
                  error={errors.icNumber?.message}
                  {...register('icNumber', {
                    required: 'IC / BC number is required.',
                    pattern: { value: IC_REGEX, message: 'Enter a valid IC number in YYMMDD-PP-ZZZG format.' },
                  })}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field
                    label="Date of Birth"
                    name="dob" id="dob" type="date" required
                    error={errors.dob?.message}
                    {...register('dob', {
                      required: 'Date of birth is required.',
                      validate: (v) => {
                        const d = new Date(v)
                        const now = new Date()
                        if (d > now) return 'Date of birth cannot be in the future.'
                        if (now.getFullYear() - d.getFullYear() > 80) return 'Please check date of birth.'
                        return true
                      },
                    })}
                  />
                  <SelectField
                    label="Gender" name="gender" id="gender" required
                    error={errors.gender?.message}
                    {...register('gender', { required: 'Gender is required.' })}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </SelectField>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <SelectField
                    label="Belt Grade" name="beltGrade" id="beltGrade" required
                    error={errors.beltGrade?.message}
                    {...register('beltGrade', { required: 'Belt grade is required.' })}
                  >
                    {BELT_GRADES.map((b) => (
                      <option key={b.value} value={b.value}>{b.value} — {b.label}</option>
                    ))}
                  </SelectField>

                  <Field
                    label="Weight (kg)"
                    name="weightKg" id="weightKg" type="number" inputMode="decimal"
                    autoComplete="off" required
                    placeholder="e.g. 52.5"
                    hint="Official weigh-in weight"
                    error={errors.weightKg?.message}
                    {...register('weightKg', {
                      required: 'Weight is required.',
                      min: { value: 10, message: 'Minimum weight 10 kg.' },
                      max: { value: 200, message: 'Maximum weight 200 kg.' },
                      validate: (v) => !isNaN(parseFloat(v)) || 'Enter a valid number.',
                    })}
                  />
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