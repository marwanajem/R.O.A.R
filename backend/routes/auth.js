import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../server.js';
import { sendOTP } from '../utils/mailer.js';

const router = express.Router();

// 1. REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, name, clubName } = req.body;

    // Generate a 6-digit OTP and set expiration (10 minutes from now)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); 

    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existing.length > 0) {
      if (existing[0].is_verified) {
       
        return res.status(400).json({ error: 'Email already exists' });
      } else {
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await pool.query(
          'UPDATE users SET password = ?, name = ?, clubName = ?, verification_token = ?, otp_expires_at = ? WHERE email = ?',
          [hashedPassword, name, clubName, otpCode, expiresAt, email]
        );
        
        await sendOTP(email, otpCode);
        return res.status(200).json({ message: 'User updated. OTP resent.', requiresVerification: true, email: email });
      }
    }

    // Completely new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const prefix = clubName ? clubName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'R') : 'ROA';
    const clubCode = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;

    await pool.query(
      'INSERT INTO users (email, password, role, name, clubName, clubCode, is_verified, verification_token, otp_expires_at) VALUES (?, ?, ?, ?, ?, ?, FALSE, ?, ?)',
      [email, hashedPassword, role || 'TM', name, clubName, clubCode, otpCode, expiresAt]
    );

    await sendOTP(email, otpCode);

    res.status(201).json({ message: 'User registered. Please check your email for the OTP.', requiresVerification: true, email: email });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// 2. RESEND OTP ROUTE 
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    if (users[0].is_verified) return res.status(400).json({ error: 'Email is already verified.' });

    // Generate new OTP & expiration
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000);

    await pool.query('UPDATE users SET verification_token = ?, otp_expires_at = ? WHERE email = ?', [otpCode, expiresAt, email]);
    await sendOTP(email, otpCode);

    res.json({ success: true, message: 'A new 6-digit code has been sent!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

// 3. VERIFY EMAIL OTP
router.post('/verify', async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    
    // Check if code matches
    if (users[0].verification_token !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if code is expired
    if (new Date(users[0].otp_expires_at) < new Date()) {
      return res.status(400).json({ error: 'This code has expired (10m limit). Please request a new one.' });
    }
   
    await pool.query('UPDATE users SET is_verified = TRUE, verification_token = NULL, otp_expires_at = NULL WHERE email = ?', [email]);
    
    res.json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

// 4. LOGIN ROUTE
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email address before logging in.', requiresVerification: true, email: user.email });
    }

    const userCreatedAt = user.created_at || user.createdAt;

    const token = jwt.sign(
      { id: user.id, role: user.role, createdAt: userCreatedAt },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role.toUpperCase(), name: user.name, clubName: user.clubName, clubCode: user.clubCode, createdAt: userCreatedAt }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// 5. UPDATE PROFILE
router.put('/profile', async (req, res) => {
  const { userId, name, email, clubName, password } = req.body;
  try {
    // authenticate the user's password before allowing changes
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, users[0].password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect password. Profile changes unauthorized.' });

    await pool.query('UPDATE users SET name = ?, email = ?, clubName = ? WHERE id = ?', [name, email, clubName, userId]);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile. That email may already be in use.' });
  }
});

// 6. UPDATE PASSWORD
router.put('/password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  try {
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect current password' });

    const salt = await bcrypt.genSalt(10);
    const hashedPw = await bcrypt.hash(newPassword, salt);
    
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPw, userId]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;