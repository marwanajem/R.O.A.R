import express from 'express';
import pool from '../server.js'; 

const router = express.Router();


router.post('/', async (req, res) => {
  try {
   
    const { 
      eventId, clubCode, fullName, icMasked, dob, gender, 
      beltGrade, ageCategory, beltGroup, weightKg, weightCategory, patternFormat 
    } = req.body;

    
    const [result] = await pool.query(
      `INSERT INTO competitors 
      (eventId, clubCode, fullName, icMasked, dob, gender, beltGrade, ageCategory, beltGroup, weightKg, weightCategory, patternFormat, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [eventId, clubCode, fullName, icMasked, dob, gender, beltGrade, ageCategory, beltGroup, weightKg, weightCategory, patternFormat]
    );

    res.status(201).json({ message: 'Competitor added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding competitor:', error);
    res.status(500).json({ error: 'Failed to add competitor' });
  }
});


router.get('/event/:eventId/club/:clubCode', async (req, res) => {
  try {
    const { eventId, clubCode } = req.params;
    const [competitors] = await pool.query(
      'SELECT * FROM competitors WHERE eventId = ? AND clubCode = ? ORDER BY created_at ASC', // usinf club code to ensure we only see specific club athletes
      [eventId, clubCode]
    );
    res.json(competitors);
  } catch (error) {
    console.error('Error fetching competitors:', error);
    res.status(500).json({ error: 'Failed to fetch competitors' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM competitors WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Competitor not found' });
    }
    
    res.json({ message: 'Competitor deleted successfully' });
  } catch (error) {
    console.error('Error deleting competitor:', error);
    res.status(500).json({ error: 'Failed to delete competitor' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { 
      fullName, icMasked, dob, gender, beltGrade, 
      ageCategory, beltGroup, weightKg, weightCategory, patternFormat 
    } = req.body;

    const [result] = await pool.query(
      `UPDATE competitors 
       SET fullName = ?, icMasked = ?, dob = ?, gender = ?, beltGrade = ?, 
           ageCategory = ?, beltGroup = ?, weightKg = ?, weightCategory = ?, patternFormat = ?
       WHERE id = ?`,
      [fullName, icMasked, dob, gender, beltGrade, ageCategory, beltGroup, weightKg, weightCategory, patternFormat, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    res.json({ message: 'Competitor updated successfully' });
  } catch (error) {
    console.error('Error updating competitor:', error);
    res.status(500).json({ error: 'Failed to update competitor' });
  }
});


router.post('/bulk', async (req, res) => {
  try {
    const { competitors } = req.body;

    if (!competitors || competitors.length === 0) {
      return res.status(400).json({ error: 'No competitors provided' });
    }

   
    const values = competitors.map(c => [
      c.eventId,
      c.clubCode,
      c.fullName,
      c.icMasked,
      c.dob,
      c.gender,
      c.beltGrade,
      c.ageCategory,
      c.beltGroup,
      c.weightKg,
      c.weightCategory,
      c.patternFormat,
      'pending' 
    ]);

   
    const [result] = await pool.query(
      `INSERT INTO competitors 
      (eventId, clubCode, fullName, icMasked, dob, gender, beltGrade, ageCategory, beltGroup, weightKg, weightCategory, patternFormat, status) 
      VALUES ?`,
      [values]
    );

    res.status(201).json({ 
      message: `Successfully added ${result.affectedRows} competitors`,
      count: result.affectedRows 
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({ error: 'Failed to upload competitors' });
  }
});

export default router;