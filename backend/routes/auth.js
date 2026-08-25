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

    
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

   
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role.toUpperCase(), name: user.name, clubName: user.clubName, clubCode: user.clubCode }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
});



export default router;