import express from 'express';
import pool from '../server.js'; // database connection
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';

const router = express.Router();

// Helper to safely parse JSON without crashing on nulls or already-parsed objects
const safeParseJSON = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch (error) {
    return fallback;
  }
};

const deriveBeltGroup = (beltGrade) => {
  if (!beltGrade) return 'Color Belt';
  const lower = beltGrade.toLowerCase();
  if (lower.includes('dan') || (lower.includes('black') && !lower.includes('kup') && !lower.includes('red'))) {
    return 'Black Belt';
  }
  return 'Color Belt';
};

const deriveAgeCategory = (dob) => {
  if (!dob) return 'Open';
  const birthYear = new Date(dob).getFullYear();
  if (Number.isNaN(birthYear)) return 'Open';
  const age = new Date().getFullYear() - birthYear;
  if (age < 12) return 'U12';
  if (age <= 14) return '12-14';
  if (age <= 17) return '15-17';
  return '18+';
};

const inferFormat = (c) => {
  if (c.format) return c.format;
  const lbl = (c.label || '').toLowerCase();
  if (lbl.includes('pair')) return 'Pair';
  if (lbl.includes('team')) return 'Team';
  return 'Individual';
};

// Shared registration helper (used by both /:id/register and /:id/cart)
async function registerAthleteToEvent({ eventId, athleteId, categoryType, categoryLabel, status }) {
  const [athletes] = await pool.query('SELECT * FROM athletes WHERE id = ?', [athleteId]);
  if (athletes.length === 0) {
    return { code: 404, body: { error: 'Athlete not found in Master Roster' } };
  }
  const a = athletes[0];

  // Prevent registering the exact same category twice
  const [duplicate] = await pool.query(
    'SELECT id FROM competitors WHERE eventId = ? AND athleteId = ? AND (weightCategory = ? OR patternFormat = ?)',
    [eventId, athleteId, categoryLabel, categoryLabel]
  );
  if (duplicate.length > 0) {
    return { code: 400, body: { error: 'Athlete is already registered in this category.' } };
  }

  // Pull ageGroup from event_categories if configured, else derive from DOB
  const [catRows] = await pool.query(
    'SELECT ageGroup FROM event_categories WHERE eventId = ? AND label = ? LIMIT 1',
    [eventId, categoryLabel]
  );
  const ageCategory = catRows[0]?.ageGroup || deriveAgeCategory(a.dob);
  const beltGroup = deriveBeltGroup(a.beltGrade);

  // If the athlete already has a row for this event with the target discipline empty, merge into it
  const [existingRow] = await pool.query(
    'SELECT id, weightCategory, patternFormat, ageCategory, beltGroup, status FROM competitors WHERE eventId = ? AND athleteId = ? LIMIT 1',
    [eventId, athleteId]
  );

  if (existingRow.length > 0) {
    const row = existingRow[0];
    const nextStatus = row.status === 'confirmed' || status === 'confirmed' ? 'confirmed' : 'cart';
    const canMergeSparring = categoryType === 'sparring' && !row.weightCategory;
    const canMergePattern = categoryType === 'pattern' && !row.patternFormat;

    if (canMergeSparring) {
      await pool.query(
        `UPDATE competitors
         SET isSparring = 1, weightCategory = ?,
             ageCategory = COALESCE(NULLIF(ageCategory, ''), ?),
             beltGroup = COALESCE(NULLIF(beltGroup, ''), ?),
             status = ?
         WHERE id = ?`,
        [categoryLabel, ageCategory, beltGroup, nextStatus, row.id]
      );
      return { code: 201, body: { success: true, message: 'Sparring category added to existing registration!' } };
    }

    if (canMergePattern) {
      await pool.query(
        `UPDATE competitors
         SET isPattern = 1, patternFormat = ?,
             ageCategory = COALESCE(NULLIF(ageCategory, ''), ?),
             beltGroup = COALESCE(NULLIF(beltGroup, ''), ?),
             status = ?
         WHERE id = ?`,
        [categoryLabel, ageCategory, beltGroup, nextStatus, row.id]
      );
      return { code: 201, body: { success: true, message: 'Pattern category added to existing registration!' } };
    }
  }

  const icMasked = a.icNumber?.length === 12
    ? `${a.icNumber.substring(0, 6)}-**-****`
    : `${(a.icNumber || '').substring(0, 4)}****`;

  const weightCat = categoryType === 'sparring' ? categoryLabel : null;
  const patternCat = categoryType === 'pattern' ? categoryLabel : null;
  const isSparringBit = categoryType === 'sparring' ? 1 : 0;
  const isPatternBit = categoryType === 'pattern' ? 1 : 0;

  await pool.query(
    `INSERT INTO competitors (
      eventId, athleteId, clubCode, fullName, icMasked, gender, dob,
      beltGrade, ageCategory, beltGroup, weightKg,
      isSparring, isPattern, weightCategory, patternFormat, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      eventId, athleteId, a.clubCode, a.fullName, icMasked, a.gender, a.dob,
      a.beltGrade, ageCategory, beltGroup, a.weightKg,
      isSparringBit, isPatternBit, weightCat, patternCat, status
    ]
  );

  return { code: 201, body: { success: true, message: 'Athlete registered successfully!' } };
}

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

// ==========================================
// 1. GET ALL EVENTS
// ==========================================
router.get('/', async (req, res) => {
  try {
    const fetchAll = req.query.all === 'true';

    let query = `
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM competitors WHERE eventId = e.id AND status != 'cart') AS competitorCount,
        (SELECT COUNT(DISTINCT clubCode) FROM competitors WHERE eventId = e.id AND status != 'cart') AS clubCount,
        (SELECT COUNT(*) FROM payments WHERE event_id = e.id AND status = 'pending') AS pendingPayments
      FROM events e
    `;

    if (!fetchAll) {
      query += " WHERE e.status != 'DRAFT'";
    }

    query += ' ORDER BY e.created_at ASC';

    const [events] = await pool.query(query);

    const formattedEvents = events.map(ev => ({
      ...ev,
      categories: safeParseJSON(ev.categories, []),
      categoryFees: safeParseJSON(ev.categoryFees, {})
    }));

    res.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ==========================================
// 2. GET SINGLE EVENT BY ID (Admin Dashboard Stats)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const [events] = await pool.query(`
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM competitors WHERE eventId = e.id AND (isSparring = 1 OR isPattern = 1) AND status != 'cart') AS billableCompetitorCount,
        (SELECT COUNT(*) FROM competitors WHERE eventId = e.id AND status != 'cart') AS totalRosterCount,
        (SELECT COUNT(DISTINCT clubCode) FROM competitors WHERE eventId = e.id AND status != 'cart') AS clubCount,
        (SELECT COUNT(*) FROM teams WHERE eventId = e.id AND status != 'cart') AS teamCount,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE event_id = e.id AND status = 'verified') AS totalCollected
      FROM events e
      WHERE e.id = ?
    `, [eventId]);

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const ev = events[0];

    ev.categories = safeParseJSON(ev.categories, []);
    ev.categoryFees = safeParseJSON(ev.categoryFees, {});

    const indivTotal = ev.categories.reduce((sum, cat) => {
      if (!cat.toLowerCase().includes('team') && !cat.toLowerCase().includes('pair')) {
        return sum + ((ev.billableCompetitorCount || 0) * parseFloat(ev.categoryFees[cat] || 0));
      }
      return sum;
    }, 0);

    const teamTotal = ev.categories.reduce((sum, cat) => {
      if (cat.toLowerCase().includes('team') || cat.toLowerCase().includes('pair')) {
        return sum + ((ev.teamCount || 0) * parseFloat(ev.categoryFees[cat] || 0));
      }
      return sum;
    }, 0);

    const formattedEvent = {
      ...ev,
      stats: {
        competitors: ev.totalRosterCount || 0,
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

// ==========================================
// 3. CREATE EVENT (POST)
// ==========================================
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    const [result] = await pool.query(`
      INSERT INTO events 
        (
          shortName, venue, type, eventDate, eventEndDate, regCloseDate, created_at, status, 
          beltGrouping, maxCapacity, bankName, bankAccount, bankAccountName, paymentRefFormat, 
          ageRule, categories, categoryFees
        ) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.name,
      data.venue,
      data.ruleset,
      data.eventDate,
      data.eventDateEnd || null,
      data.regEnd,
      data.regStart || new Date(),
      data.status || 'DRAFT',
      data.beltGrouping || 'all',
      data.maxCompetitors || null,
      data.bankName || null,
      data.bankAccount || null,
      data.bankAccountName || null,
      data.paymentRef || null,
      data.ageRule || 'year_of_birth',
      JSON.stringify(data.categories || []),
      JSON.stringify(data.fees || {})
    ]);

    res.status(201).json({
      success: true,
      eventId: result.insertId,
      message: 'Event created successfully!'
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ==========================================
// 4. UPDATE EVENT (PUT)
// ==========================================
router.put('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const data = req.body;

    const [result] = await pool.query(`
      UPDATE events 
      SET 
        shortName = ?, venue = ?, type = ?, eventDate = ?, eventEndDate = ?, regCloseDate = ?, status = ?, 
        beltGrouping = ?, maxCapacity = ?, bankName = ?, bankAccount = ?, bankAccountName = ?, 
        paymentRefFormat = ?, ageRule = ?, categories = ?, categoryFees = ?
      WHERE id = ?
    `, [
      data.name,
      data.venue,
      data.ruleset,
      data.eventDate,
      data.eventDateEnd || null,
      data.regEnd,
      data.status,
      data.beltGrouping || 'all',
      data.maxCompetitors || null,
      data.bankName || null,
      data.bankAccount || null,
      data.bankAccountName || null,
      data.paymentRef || null,
      data.ageRule || 'year_of_birth',
      JSON.stringify(data.categories || []),
      JSON.stringify(data.fees || {}),
      eventId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ success: true, message: 'Event updated successfully!' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// ==========================================
// 5. DELETE EVENT (HARD DELETE FOR DRAFTS)
// ==========================================
router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const eventId = req.params.id;
    await connection.beginTransaction();

    await connection.query('DELETE FROM event_categories WHERE eventId = ?', [eventId]);
    await connection.query('DELETE FROM competitors WHERE eventId = ?', [eventId]);
    await connection.query('DELETE FROM teams WHERE eventId = ?', [eventId]);
    await connection.query('DELETE FROM payments WHERE event_id = ?', [eventId]);
    await connection.query('DELETE FROM special_requests WHERE eventId = ?', [eventId]);

    const [result] = await connection.query('DELETE FROM events WHERE id = ?', [eventId]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Event not found' });
    }

    await connection.commit();
    res.json({ success: true, message: 'Event permanently deleted.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  } finally {
    connection.release();
  }
});

// ==========================================
// 6. SMART REGISTRATION (Cart & Instant)
// ==========================================
router.post('/:id/cart', async (req, res) => {
  try {
    const result = await registerAthleteToEvent({
      eventId: req.params.id,
      ...req.body,
      status: 'cart'
    });
    res.status(result.code).json(result.body);
  } catch (error) {
    console.error('Cart Error:', error);
    res.status(500).json({ error: 'Failed to add athlete to cart' });
  }
});

router.post('/:id/register', async (req, res) => {
  try {
    const result = await registerAthleteToEvent({
      eventId: req.params.id,
      ...req.body,
      status: 'confirmed'
    });
    res.status(result.code).json(result.body);
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Failed to register athlete' });
  }
});

// ==========================================
// 7. EDGE CASES: SUBMIT SPECIAL REQUEST
// ==========================================
router.post('/:id/special-requests', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { athleteId, clubCode, discipline, requestNote } = req.body;

    if (!athleteId || !requestNote) return res.status(400).json({ error: 'Missing required fields' });

    await pool.query(`
      INSERT INTO special_requests (eventId, clubCode, athleteId, discipline, requestNote, status)
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `, [eventId, clubCode, athleteId, discipline, requestNote]);

    res.status(201).json({ success: true, message: 'Special request submitted successfully.' });
  } catch (error) {
    console.error('Request Error:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// ==========================================
// 8. CASH CHECKOUT (Pay on Event Day)
// ==========================================
router.post('/:id/checkout-cash', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const eventId = req.params.id;
    const { userId, clubCode, amount } = req.body;

    if (!userId || !clubCode) {
      return res.status(400).json({ error: 'User ID and Club Code are required.' });
    }

    await connection.beginTransaction();

    await connection.query(`
      INSERT INTO payments (event_id, user_id, amount, reference_code, proof_url, status) 
      VALUES (?, ?, ?, 'PAY-ON-DAY', NULL, 'pending')
    `, [eventId, userId, amount || 0]);

    // Transition any remaining 'cart' entries to 'confirmed' (safe even if already confirmed via /register)
    await connection.query(`
      UPDATE competitors SET status = 'confirmed' 
      WHERE eventId = ? AND clubCode = ? AND status = 'cart'
    `, [eventId, clubCode]);

    await connection.commit();
    res.status(200).json({ success: true, message: 'Registration confirmed! Please pay cash on event day.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error processing cash checkout:', error);
    res.status(500).json({ error: 'Failed to process checkout.' });
  } finally {
    connection.release();
  }
});

// ==========================================
// OTHER ROUTES (Competitors, Categories, Payments)
// ==========================================

router.get('/:id/competitors', async (req, res) => {
  try {
    const eventId = req.params.id;
    const [competitors] = await pool.query(`
      SELECT 
        c.id, c.athleteId, c.fullName, c.clubCode, u.clubName, c.icMasked, 
        DATE_FORMAT(c.dob, '%Y-%m-%d') AS dob, c.gender, c.beltGrade, c.ageCategory, 
        c.beltGroup, c.weightKg, c.weightCategory, c.weightCategory AS weightClass, c.patternFormat, 
        c.isSparring, c.isPattern, c.status 
      FROM competitors c
      LEFT JOIN users u ON c.clubCode = u.clubCode
      WHERE c.eventId = ?
      GROUP BY c.id
    `, [eventId]);
    res.json(competitors);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch competitor roster' }); }
});

router.patch('/:id/competitors/bulk-update', async (req, res) => {
  try {
    const { competitorIds, updates } = req.body;
    const eventId = req.params.id;
    if (!competitorIds || competitorIds.length === 0) return res.status(400).json({ error: 'No competitors selected' });

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
  } catch (error) { res.status(500).json({ error: 'Failed to merge competitors' }); }
});

router.put('/:eventId/competitors/:competitorId', async (req, res) => {
  try {
    const { eventId, competitorId } = req.params;
    const { weightCategory, ageCategory, beltGroup, weightKg, patternFormat, isSparring, isPattern, status } = req.body;
    const [result] = await pool.query(`
      UPDATE competitors SET weightCategory = ?, ageCategory = ?, beltGroup = ?, weightKg = ?, patternFormat = ?, isSparring = ?, isPattern = ?, status = ? WHERE id = ? AND eventId = ?
    `, [weightCategory, ageCategory, beltGroup, weightKg, patternFormat, isSparring, isPattern, status, competitorId, eventId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Competitor not found' });
    res.json({ success: true, message: 'Competitor overridden successfully' });
  } catch (error) { res.status(500).json({ error: 'Failed to update competitor' }); }
});

router.get('/:id/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM event_categories WHERE eventId = ?', [req.params.id]);
    res.json(categories);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch categories' }); }
});

router.patch('/:id/categories', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const eventId = req.params.id;
    const { classes } = req.body;
    await connection.beginTransaction();
    await connection.query('DELETE FROM event_categories WHERE eventId = ?', [eventId]);
    if (classes && classes.length > 0) {
      const insertValues = classes.map(c => [
        eventId, c.id, c.type || 'sparring', inferFormat(c),
        c.label, c.gender, c.ageGroup, c.overrideMin, c.overrideMax, c.enabled ? 1 : 0
      ]);
      await connection.query(
        `INSERT INTO event_categories (eventId, categoryId, type, format, label, gender, ageGroup, overrideMin, overrideMax, isEnabled) VALUES ?`,
        [insertValues]
      );
    }
    await connection.commit();
    res.json({ success: true, message: 'Categories updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving categories:', error);
    res.status(500).json({ error: 'Failed to save categories' });
  } finally { connection.release(); }
});

router.get('/:id/payments/club/:clubCode/total', async (req, res) => {
  try {
    const { id, clubCode } = req.params;
    const [result] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS totalPaid FROM payments p JOIN users u ON p.user_id = u.id WHERE p.event_id = ? AND u.clubCode = ? AND p.status = 'verified'
    `, [id, clubCode]);
    res.json({ totalPaid: parseFloat(result[0].totalPaid) });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch total paid' }); }
});

router.get('/:id/payments', async (req, res) => {
  try {
    const eventId = req.params.id;
    const [payments] = await pool.query(`
      SELECT p.id, p.amount, p.reference_code AS ref, p.status, p.proof_url, DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') AS submittedAt, u.clubName AS club, u.clubCode
      FROM payments p JOIN users u ON p.user_id = u.id WHERE p.event_id = ? ORDER BY p.created_at DESC
    `, [eventId]);
    const formattedPayments = payments.map(pay => ({ ...pay, id: `PAY-${String(pay.id).padStart(3, '0')}` }));
    res.json(formattedPayments);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch payment queue' }); }
});

router.post('/:id/payments', upload.single('proofFile'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const { amount, userId, user_id, referenceCode, reference_code } = req.body;
    const uid = userId || user_id;
    const ref = referenceCode || reference_code;

    if (!req.file) return res.status(400).json({ error: 'Receipt image is required' });
    if (!uid) return res.status(400).json({ error: 'User ID is missing from the submission' });

    const proof_url = `/uploads/payments/${req.file.filename}`;
    const [result] = await pool.query(
      `INSERT INTO payments (event_id, user_id, amount, reference_code, proof_url, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [eventId, uid, amount, ref, proof_url]
    );

    // INSTANT CONFIRMATION: Transition 'cart' directly to 'confirmed'
    await pool.query(
      `UPDATE competitors SET status = 'confirmed' WHERE eventId = ? AND clubCode = (SELECT clubCode FROM users WHERE id = ?) AND status = 'cart'`,
      [eventId, uid]
    );

    res.status(201).json({ success: true, paymentId: result.insertId, message: 'Registration confirmed! Payment is pending admin verification.' });
  } catch (error) { res.status(500).json({ error: 'Failed to submit payment' }); }
});

router.patch('/:eventId/payments/:paymentId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { status } = req.body;
    const eventId = req.params.eventId;
    const rawPaymentId = parseInt(req.params.paymentId.replace('PAY-', ''), 10);

    await connection.beginTransaction();

    // Only update the financial ledger. Do not touch the competitors table.
    const [payResult] = await connection.query('UPDATE payments SET status = ? WHERE id = ? AND event_id = ?', [status, rawPaymentId, eventId]);

    if (payResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Payment not found' });
    }

    await connection.commit();
    res.json({ success: true, message: `Payment marked as ${status}.` });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed to process payment verification' });
  } finally {
    connection.release();
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { status } = req.body;
    const [result] = await pool.query('UPDATE events SET status = ? WHERE id = ?', [status, eventId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, message: `Event is now ${status}` });
  } catch (error) { res.status(500).json({ error: 'Failed to update event status' }); }
});

router.get('/:id/template', async (req, res) => {
  try {
    const eventId = req.params.id;
    const [events] = await pool.query('SELECT shortName, type FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) return res.status(404).json({ error: 'Event not found' });
    const event = events[0];

    let [weightCategories] = await pool.query('SELECT label FROM event_categories WHERE eventId = ? AND isEnabled = 1 AND type = "sparring"', [eventId]);
    if (weightCategories.length === 0) [weightCategories] = await pool.query('SELECT label FROM weight_templates WHERE ruleset = ?', [event.type]);
    const weightLabels = weightCategories.map(c => c.label);

    let [patternCategories] = await pool.query('SELECT label FROM event_categories WHERE eventId = ? AND isEnabled = 1 AND type = "pattern"', [eventId]);
    if (patternCategories.length === 0) [patternCategories] = await pool.query('SELECT label FROM pattern_templates WHERE ruleset = ? AND eventType = "individual"', [event.type]);
    const patternLabels = patternCategories.map(p => p.label);

    const beltLabels = [
      '10th Kup (White)', '9th Kup (White-Yellow)', '8th Kup (Yellow)', '7th Kup (Yellow-Green)',
      '6th Kup (Green)', '5th Kup (Green-Blue)', '4th Kup (Blue)', '3rd Kup (Blue-Red)',
      '2nd Kup (Red)', '1st Kup (Red-Black)', '1st Dan (Black)', '2nd Dan (Black)',
      '3rd Dan (Black)', '4th Dan (Black)', '5th Dan (Black)', '6th Dan (Black)'
    ];

    const workbook = new ExcelJS.Workbook();
    const dropSheet = workbook.addWorksheet('_Dropdowns', { state: 'veryHidden' });
    dropSheet.getColumn(1).values = ['Weights', ...weightLabels];
    dropSheet.getColumn(2).values = ['Genders', 'M', 'F'];
    dropSheet.getColumn(3).values = ['YesNo', 'Yes', 'No'];
    dropSheet.getColumn(4).values = ['Belts', ...beltLabels];
    dropSheet.getColumn(5).values = ['Patterns', ...patternLabels];
    const sheet = workbook.addWorksheet('Registration');
    sheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 }, { header: 'IC/ID (Masked)', key: 'icMasked', width: 20 },
      { header: 'Date of Birth (YYYY-MM-DD)', key: 'dob', width: 25 }, { header: 'Gender', key: 'gender', width: 15 },
      { header: 'Belt Grade/Rank', key: 'beltGrade', width: 25 }, { header: 'Sparring? (Yes/No)', key: 'isSparring', width: 18 },
      { header: 'Weight (kg)', key: 'weightKg', width: 15 }, { header: 'Weight Category (Select)', key: 'weightCategory', width: 35 },
      { header: 'Pattern? (Yes/No)', key: 'isPattern', width: 18 }, { header: 'Pattern Format (Select)', key: 'patternFormat', width: 35 },
    ];
    sheet.getColumn('icMasked').numFmt = '@';
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };

    for (let i = 2; i <= 500; i++) {
      sheet.getCell(`D${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['_Dropdowns!$B$2:$B$3'] };
      sheet.getCell(`E${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`_Dropdowns!$D$2:$D$${beltLabels.length + 1}`], showErrorMessage: true, errorTitle: 'Invalid Belt', error: 'Please select a belt from the list.' };
      sheet.getCell(`F${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['_Dropdowns!$C$2:$C$3'] };
      if (weightLabels.length > 0) sheet.getCell(`H${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`_Dropdowns!$A$2:$A$${weightLabels.length + 1}`], showErrorMessage: true, errorTitle: 'Invalid Category', error: 'Please select a valid weight category.' };
      sheet.getCell(`I${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['_Dropdowns!$C$2:$C$3'] };
      if (patternLabels.length > 0) sheet.getCell(`J${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`_Dropdowns!$E$2:$E$${patternLabels.length + 1}`], showErrorMessage: true, errorTitle: 'Invalid Pattern', error: 'Please select a valid pattern format.' };
    }

    await sheet.protect('roar-secret-password', { selectLockedCells: true, selectUnlockedCells: true, formatCells: true, formatColumns: true, formatRows: true, insertRows: true, deleteRows: true });
    for (let i = 2; i <= 500; i++) sheet.getRow(i).eachCell({ includeEmpty: true }, (cell) => { cell.protection = { locked: false }; });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ROAR_Registration_Template_${event.shortName.replace(/\s+/g, '_')}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { res.status(500).json({ error: 'Failed to generate template' }); }
});

export default router;