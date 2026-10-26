import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import { tmTopNavSections, adminTopNavSections } from '../../utils/navSections'

const PasswordField = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false)
  return (
    <div style={{ width: '100%' }}>
      <label className="field-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input 
          type={show ? "text" : "password"}
          className="field-input" 
          value={value} 
          onChange={onChange} 
          required 
          style={{ paddingRight: '4rem', width: '100%' }} 
        />
        <button 
          type="button"
          onClick={() => setShow(!show)}
          style={{
            position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer',
            fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600
          }}
        >
          {show ? 'HIDE' : 'SHOW'}
        </button>
      </div>
    </div>
  )
}

const ReqItem = ({ met, text }) => (
  <div style={{ 
    fontSize: '0.75rem', 
    color: met ? 'var(--ok)' : 'var(--muted)', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem',
    fontFamily: 'JetBrains Mono, monospace',
    marginBottom: '0.25rem'
  }}>
    <span style={{ fontSize: '1rem', fontWeight: 700 }}>{met ? '✓' : '○'}</span>
    <span style={{ textDecoration: met ? 'line-through' : 'none', opacity: met ? 0.7 : 1 }}>
      {text}
    </span>
  </div>
)

export default function Profile() {
  const { user } = useAuth()
  
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [profileMsg, setProfileMsg] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN'
  const navSections = isAdmin ? adminTopNavSections() : tmTopNavSections()

  const reqLength = newPassword.length >= 8
  const reqUpper = /[A-Z]/.test(newPassword)
  const reqNumber = /[0-9]/.test(newPassword)
  const reqSpecial = /[^A-Za-z0-9]/.test(newPassword)
  const isPasswordValid = reqLength && reqUpper && reqNumber && reqSpecial

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setProfileMsg('Saving...')
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name, email })
      })
      const data = await res.json()
      if (res.ok) {
        setProfileMsg('Profile updated successfully! (Refresh to see changes in menu)')
      } else {
        setProfileMsg(data.error || 'Update failed.')
      }
    } catch (err) {
      setProfileMsg('Server error.')
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    
    // NEW: Block them from recycling the exact same password
    if (currentPassword === newPassword) {
      return setPasswordMsg('New password cannot be the same as your current password.')
    }
    
    if (!isPasswordValid) {
      return setPasswordMsg('Please meet all security requirements.')
    }
    if (newPassword !== confirmPassword) {
      return setPasswordMsg('New passwords do not match.')
    }
    
    setPasswordMsg('Updating...')
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword, newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordMsg('Password changed successfully.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordMsg(data.error || 'Password update failed.')
      }
    } catch (err) {
      setPasswordMsg('Server error.')
    }
  }

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Account Settings' }]} />
      <div className="wf-body">
        <SideNav sections={navSections} />
        
        <div className="wf-main" style={{ padding: '2rem', maxWidth: '1000px' }}>
          <PageHead title="MY PROFILE" sub="Manage your account settings and credentials" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {!isAdmin && (
                <div className="box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--ink)' }}>CLUB INFORMATION</h3>
                    <Chip variant="gold">ACTIVE</Chip>
                  </div>
                  <hr className="divider" style={{ margin: '1rem 0' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <div className="section-label" style={{ marginBottom: '4px' }}>CLUB NAME</div>
                      <div style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{user?.clubName || 'N/A'}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <div className="section-label" style={{ marginBottom: '4px' }}>CLUB CODE</div>
                        <div className="mono" style={{ color: 'var(--gold)' }}>{user?.clubCode || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="section-label" style={{ marginBottom: '4px' }}>DATE JOINED</div>
                        <div className="mono" style={{ color: 'var(--muted)' }}>
                          {user?.createdAt 
                            ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                            : '01/01/2026'} 
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="box">
                <h3 style={{ fontSize: '1rem', color: 'var(--ink)', marginBottom: '1.25rem' }}>PERSONAL DETAILS</h3>
                <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label className="field-label">FULL NAME</label>
                    <input type="text" className="field-input" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="field-label">EMAIL ADDRESS</label>
                    <input type="email" className="field-input" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  
                  {profileMsg && <div style={{ fontSize: '0.875rem', color: 'var(--gold)' }}>{profileMsg}</div>}
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <Btn variant="primary" type="submit">SAVE CHANGES</Btn>
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="box" style={{ borderColor: 'var(--line)' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--ink)', marginBottom: '1.25rem' }}>CHANGE PASSWORD</h3>
               <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  <PasswordField label="CURRENT PASSWORD" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  <hr className="divider" />
                  
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <PasswordField label="NEW PASSWORD" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    
                    
                    {newPassword.length > 0 && (
                      <div style={{ padding: '0.75rem', background: 'var(--paper-2)', borderRadius: '4px', border: '1px solid var(--line)' }}>
                        <ReqItem met={reqLength} text="8+ characters" />
                        <ReqItem met={reqUpper} text="1+ uppercase letter" />
                        <ReqItem met={reqNumber} text="1+ number" />
                        <ReqItem met={reqSpecial} text="1+ special char" />
                      </div>
                    )}
                  </div>

                  <PasswordField label="CONFIRM NEW PASSWORD" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />

                  {passwordMsg && <div style={{ fontSize: '0.875rem', color: passwordMsg.includes('success') ? 'var(--ok)' : 'var(--stamp)' }}>{passwordMsg}</div>}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <Btn variant="primary" type="submit" style={{ backgroundColor: 'var(--paper-3)', color: 'var(--ink)', opacity: isPasswordValid ? 1 : 0.5 }}>
                      UPDATE PASSWORD
                    </Btn>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}