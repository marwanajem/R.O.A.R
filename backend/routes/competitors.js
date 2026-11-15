import express from 'express';
import pool from '../server.js'; 

const router = express.Router();

/* 
  ========================================================
  NOTE: Manual POST ('/') and Bulk Upload ('/bulk') routes 
  have been permanently removed. 
  
  Athlete registration is now exclusively handled via the 
  Master Roster Smart Registration engine in events.js 
  to enforce strict weight, age, and gender rules.
  ========================================================
*/

// GET: Fetch event-specific competitors for a club (Required for Team Builder!)
router.get('/event/:eventId/club/:clubCode', async (req, res) => {
  try {
    const { eventId, clubCode } = req.params;
    
    // Selects all columns including patternFormat and weightCategory
    const [competitors] = await pool.query(
      `SELECT * FROM competitors WHERE eventId = ? AND clubCode = ?`,
      [eventId, clubCode]
    );
    
    res.json(competitors);
  } catch (error) {
    console.error('Error fetching event club competitors:', error);
    res.status(500).json({ error: 'Failed to fetch competitors' });
  }
});

// PUT: Update an existing competitor snapshot (EditCompetitor.jsx)
// Used when an Admin or TM needs to manually adjust a drafted athlete
router.put('/:id', async (req, res) => {
  try {
    const { 
      fullName, icMasked, dob, gender, beltGrade, 
      ageCategory, beltGroup, weightKg, weightCategory, patternFormat, isSparring, isPattern
    } = req.body;

    const [result] = await pool.query(
      `UPDATE competitors 
       SET fullName = ?, icMasked = ?, dob = ?, gender = ?, beltGrade = ?, 
           ageCategory = ?, beltGroup = ?, weightKg = ?, weightCategory = ?, patternFormat = ?, isSparring=?, isPattern=?
       WHERE id = ?`,
      [fullName, icMasked, dob, gender, beltGrade, ageCategory, beltGroup, weightKg, weightCategory, patternFormat, isSparring, isPattern, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    res.json({ success: true, message: 'Competitor updated successfully' });
  } catch (error) {
    console.error('Error updating competitor:', error);
    res.status(500).json({ error: 'Failed to update competitor' });
  }
});

// DELETE: Remove a competitor from an event (Withdrawal or fixing a mistake)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM competitors WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Competitor not found' });
    }
    
    res.json({ success: true, message: 'Competitor deleted successfully' });
  } catch (error) {
    console.error('Error deleting competitor:', error);
    res.status(500).json({ error: 'Failed to delete competitor' });
  }
});

// GET: Fetch ALL historical event registrations for a specific club 
// (Used by Overall Club Stats / Historical views)
router.get('/club/:clubCode', async (req, res) => {
  try {
    const { clubCode } = req.params;
    const [competitors] = await pool.query(
      `SELECT c.*, e.shortName AS eventName 
       FROM competitors c 
       LEFT JOIN events e ON c.eventId = e.id 
       WHERE c.clubCode = ? 
       ORDER BY c.created_at DESC`,
      [clubCode]
    );
    res.json(competitors);
  } catch (error) {
    console.error('Error fetching historical club roster:', error);
    res.status(500).json({ error: 'Failed to fetch historical club roster' });
  }
});

export default router;