import express from 'express';
import pool from '../server.js'; // database connection
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Create the uploads directory if it doesn't exist
const uploadDir = 'uploads/payments';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure where and how the files are saved
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET all events (now with dynamic competitor, club & payment counts!)
router.get('/', async (req, res) => {
  try {
    const [events] = await pool.query(`
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM competitors WHERE eventId = e.id) AS competitorCount,
        (SELECT COUNT(DISTINCT clubCode) FROM competitors WHERE eventId = e.id) AS clubCount,
        (SELECT COUNT(*) FROM payments WHERE event_id = e.id AND status = 'pending') AS pendingPayments
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
        (SELECT COUNT(DISTINCT clubCode) FROM competitors WHERE eventId = e.id) AS clubCount,
        (SELECT COUNT(*) FROM teams WHERE eventId = e.id) AS teamCount,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE event_id = e.id AND status = 'verified') AS totalCollected
      FROM events e
      WHERE e.id = ?
    `, [eventId]);

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const ev = events[0];
    
    
    const indivRate = parseFloat(ev.individualFee || 0);
    const teamRate = parseFloat(ev.teamFee || 0);
    
    const indivTotal = (ev.competitorCount || 0) * indivRate;
    const teamTotal = (ev.teamCount || 0) * teamRate;
    
    const formattedEvent = {
      ...ev,
      stats: {
        competitors: ev.competitorCount || 0,
        clubs: ev.clubCount || 0,
        teams: ev.teamCount || 0, 
        feesCollected: parseFloat(ev.totalCollected || 0), 
        feesTotal: indivTotal + teamTotal 
      }
    };

    res.json(formattedEvent);
  } catch (error) {
    console.error('Error fetching single event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
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
        isSparring,   
        isPattern,    
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

// PATCH: Bulk update competitors (Category Merger)
router.patch('/:id/competitors/bulk-update', async (req, res) => {
  try {
    const { competitorIds, updates } = req.body;
    const eventId = req.params.id;

    if (!competitorIds || competitorIds.length === 0) {
      return res.status(400).json({ error: 'No competitors selected' });
    }

    const setClauses = [];
    const values = [];

    
    if (updates.weightClass) { setClauses.push('weightCategory = ?'); values.push(updates.weightClass); }
    if (updates.ageCategory) { setClauses.push('ageCategory = ?'); values.push(updates.ageCategory); }
    if (updates.beltGroup) { setClauses.push('beltGroup = ?'); values.push(updates.beltGroup); }

    if (setClauses.length === 0) return res.status(400).json({ error: 'No updates provided' });

    
    const query = `UPDATE competitors SET ${setClauses.join(', ')} WHERE eventId = ? AND id IN (?)`;
    values.push(eventId, competitorIds);

    const [result] = await pool.query(query, values);
    res.json({ success: true, updatedCount: result.affectedRows });
  } catch (error) {
    console.error('Error merging competitors:', error);
    res.status(500).json({ error: 'Failed to merge competitors' });
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
// GET: Fetch category overrides for a specific event
router.get('/:id/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM event_categories WHERE eventId = ?', 
      [req.params.id]
    );
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// PATCH: Save all category overrides for an event
router.patch('/:id/categories', async (req, res) => {
  const connection = await pool.getConnection(); 
  try {
    const eventId = req.params.id;
    const { classes } = req.body;

    await connection.beginTransaction();

  
    await connection.query('DELETE FROM event_categories WHERE eventId = ?', [eventId]);

  
    if (classes && classes.length > 0) {
      const insertValues = classes.map(c => [
        eventId,
        c.id, 
        c.label,
        c.gender,
        c.ageGroup,
        c.overrideMin,
        c.overrideMax,
        c.enabled ? 1 : 0
      ]);

      await connection.query(`
        INSERT INTO event_categories 
        (eventId, categoryId, label, gender, ageGroup, overrideMin, overrideMax, isEnabled) 
        VALUES ?
      `, [insertValues]);
    }

    await connection.commit();
    res.json({ success: true, message: 'Categories updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving categories:', error);
    res.status(500).json({ error: 'Failed to save categories' });
  } finally {
    connection.release();
  }
});

// GET: Total verified payments for a specific event and club
router.get('/:id/payments/club/:clubCode/total', async (req, res) => {
  try {
    const { id, clubCode } = req.params;
    
    const [result] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS totalPaid 
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.event_id = ? AND u.clubCode = ? AND p.status = 'verified'
    `, [id, clubCode]);

    res.json({ totalPaid: parseFloat(result[0].totalPaid) });
  } catch (error) {
    console.error('Error fetching total paid for club:', error);
    res.status(500).json({ error: 'Failed to fetch total paid' });
  }
});

/// GET payments for a specific event
router.get('/:id/payments', async (req, res) => {
  try {
    const eventId = req.params.id;

    const [payments] = await pool.query(`
      SELECT 
        p.id, 
        p.amount, 
        p.reference_code AS ref, 
        p.status, 
        p.proof_url, 
        DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') AS submittedAt,
        u.clubName AS club,
        u.clubCode
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.event_id = ?
      ORDER BY p.created_at DESC
    `, [eventId]);

    
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

// PATCH: Update a payment's status (Admin only)
router.patch('/:eventId/payments/:paymentId', async (req, res) => {
  const connection = await pool.getConnection(); 
  try {
    const { status } = req.body; 
    const eventId = req.params.eventId;
    const rawPaymentId = parseInt(req.params.paymentId.replace('PAY-', ''), 10);

    await connection.beginTransaction();

    
    const [payResult] = await connection.query(
      'UPDATE payments SET status = ? WHERE id = ? AND event_id = ?',
      [status, rawPaymentId, eventId]
    );

    if (payResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Payment not found' });
    }

   
    const [userRows] = await connection.query(`
      SELECT u.clubCode 
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [rawPaymentId]);

    if (userRows.length > 0) {
      const clubCode = userRows[0].clubCode;

     
      if (status === 'verified') {
        await connection.query(`
          UPDATE competitors 
          SET status = 'confirmed' 
          WHERE eventId = ? AND clubCode = ?
        `, [eventId, clubCode]);
      } 
      
      else if (status === 'rejected') {
        await connection.query(`
          UPDATE competitors 
          SET status = 'pending' 
          WHERE eventId = ? AND clubCode = ?
        `, [eventId, clubCode]);
      }
    }

    await connection.commit();
    res.json({ success: true, message: `Payment marked as ${status} and roster updated.` });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to process payment verification' });
  } finally {
    connection.release();
  }
});

// POST: Submit a payment with a receipt image
router.post('/:id/payments', upload.single('receipt'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const { amount, reference_code, user_id } = req.body;
    
    
    if (!req.file) {
      return res.status(400).json({ error: 'Receipt image is required' });
    }

    
    const proof_url = `/uploads/payments/${req.file.filename}`;

    const [result] = await pool.query(`
      INSERT INTO payments 
        (event_id, user_id, amount, reference_code, proof_url, status) 
      VALUES 
        (?, ?, ?, ?, ?, 'pending')
    `, [eventId, user_id, amount, reference_code, proof_url]);

    res.status(201).json({ 
      success: true, 
      paymentId: result.insertId,
      message: 'Payment submitted successfully and is pending admin verification.' 
    });

  } catch (error) {
    console.error('Error submitting payment:', error);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});
// PUT: Admin override for a specific competitor
router.put('/:eventId/competitors/:competitorId', async (req, res) => {
  try {
    const { eventId, competitorId } = req.params;
    
    
    const { 
      weightCategory, 
      ageCategory, 
      beltGroup, 
      weightKg, 
      patternFormat, 
      isSparring, 
      isPattern, 
      status 
    } = req.body;

    const [result] = await pool.query(`
      UPDATE competitors 
      SET weightCategory = ?, ageCategory = ?, beltGroup = ?, weightKg = ?, patternFormat = ?, isSparring = ?, isPattern = ?, status = ? 
      WHERE id = ? AND eventId = ?
    `, [weightCategory, ageCategory, beltGroup, weightKg, patternFormat, isSparring, isPattern, status, competitorId, eventId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    res.json({ success: true, message: 'Competitor overridden successfully' });
  } catch (error) {
    console.error('Error overriding competitor:', error);
    res.status(500).json({ error: 'Failed to update competitor' });
  }
});


// PATCH: Update event registration status 
router.patch('/:id/status', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { status } = req.body; 

    const [result] = await pool.query(
      'UPDATE events SET status = ? WHERE id = ?',
      [status, eventId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ success: true, message: `Event is now ${status}` });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});
export default router;