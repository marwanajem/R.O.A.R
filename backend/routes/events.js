import express from 'express';
import pool from '../server.js'; // database connection

const router = express.Router();

// GET all events (now with dynamic competitor & club counts!)
router.get('/', async (req, res) => {
  try {
    const [events] = await pool.query(`
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM competitors WHERE eventId = e.id) AS competitorCount,
        (SELECT COUNT(DISTINCT clubCode) FROM competitors WHERE eventId = e.id) AS clubCount
      FROM events e
      ORDER BY e.created_at ASC
    `);
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET single event with live stats by ID
router.get('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const [events] = await pool.query(`
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM competitors WHERE eventId = e.id) AS competitorCount,
        (SELECT COUNT(DISTINCT clubCode) FROM competitors WHERE eventId = e.id) AS clubCount
      FROM events e
      WHERE e.id = ?
    `, [eventId]);

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const ev = events[0];
    
    
    const formattedEvent = {
      ...ev,
      stats: {
        competitors: ev.competitorCount || 0,
        clubs: ev.clubCount || 0,
        teams: 0, 
        feesCollected: 0, 
        feesTotal: (ev.competitorCount || 0) * 60 
      }
    };

    res.json(formattedEvent);
  } catch (error) {
    console.error('Error fetching single event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// GET payments for a specific event
router.get('/:id/payments', async (req, res) => {
  try {
    const eventId = req.params.id;

    const [payments] = await pool.query(`
      SELECT 
        p.id, 
        p.amount, 
        p.reference_code AS ref, 
        p.status, 
        DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') AS submittedAt,
        u.clubName AS club,
        u.clubCode
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.event_id = ?
      ORDER BY p.created_at DESC
    `, [eventId]);

    // Format the numeric DB id to match'PAY-001' style
    const formattedPayments = payments.map(pay => ({
      ...pay,
      id: `PAY-${String(pay.id).padStart(3, '0')}`
    }));
    res.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payment queue' });
  }
});

// GET all competitors for a specific event
router.get('/:id/competitors', async (req, res) => {
  try {
    const eventId = req.params.id;

    const [competitors] = await pool.query(`
      SELECT 
        id, 
        fullName, 
        clubCode, 
        clubCode AS clubName,
        icMasked, 
        DATE_FORMAT(dob, '%Y-%m-%d') AS dob, 
        gender, 
        beltGrade, 
        ageCategory, 
        beltGroup, 
        weightKg, 
        weightCategory AS weightClass, 
        patternFormat, 
        status 
      FROM competitors 
      WHERE eventId = ?
    `, [eventId]);

    res.json(competitors);
  } catch (error) {
    console.error('Error fetching competitors:', error);
    res.status(500).json({ error: 'Failed to fetch competitor roster' });
  }
});

// POST: Create a new championship event
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    
    const [result] = await pool.query(`
      INSERT INTO events 
        (shortName, venue, type, eventDate, regCloseDate, status, individualFee, teamFee) 
      VALUES 
        (?, ?, ?, ?, ?, 'UPCOMING', ?, ?)
    `, [
      data.name,           // Goes into 'shortName'
      data.venue,          // Goes into 'venue'
      data.ruleset,        // Goes into 'type' (ITF or WT)
      data.eventDate,      // Goes into 'eventDate'
      data.regEnd,         // Goes into 'regCloseDate'
      data.feeIndividual,  // Goes into 'individualFee'
      data.feeTeam         // Goes into 'teamFee'
    ]);

    res.status(201).json({ 
      success: true, 
      eventId: result.insertId, 
      message: 'Event published successfully!' 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});
export default router;