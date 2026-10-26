import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../server.js';

const router = express.Router();

//register route
router.post('/register', async (req, res) => {
  try {
    
    const { email, password, role, name, clubName } = req.body;

    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // unique Club Code 
    const prefix = clubName ? clubName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'R') : 'ROA';
    const clubCode = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;

   
    await pool.query(
      'INSERT INTO users (email, password, role, name, clubName, clubCode) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, role || 'TM', name, clubName, clubCode]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

//login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // find the user by email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
      user: { id: user.id, email: user.email, role: user.role.toUpperCase(), name: user.name, clubName: user.clubName, clubCode: user.clubCode, createdAt:userCreatedAt }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// PUT: Update Profile Name & Email
router.put('/profile', async (req, res) => {
  const { userId, name, email } = req.body;
  try {
    await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, userId]);
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile. Email may already be in use.' });
  }
});

// PUT: Update Password
router.put('/password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  try {
    
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect current password' });

    // hash the new password 
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