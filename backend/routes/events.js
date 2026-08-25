import express from 'express';
import pool from '../server.js'; // database connection

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const [events] = await pool.query('SELECT * FROM events ORDER BY created_at ASC');
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(events[0]);
  } catch (error) {
    console.error('Error fetching single event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

export default router;