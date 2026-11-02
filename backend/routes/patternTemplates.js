import express from 'express';
import pool from '../server.js'; 

const router = express.Router();

// GET: Fetch pattern templates for a specific ruleset (ITF or WT)
router.get('/:ruleset', async (req, res) => {
  try {
    const ruleset = req.params.ruleset.toUpperCase();
    
    const [rows] = await pool.query(`
      SELECT 
        id, 
        ruleset, 
        ageGroup, 
        gender, 
        beltGroup, 
        label, 
        requiredPattern 
      FROM pattern_templates 
      WHERE ruleset = ?
    `, [ruleset]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching pattern templates:', error);
    res.status(500).json({ error: 'Failed to fetch pattern templates' });
  }
});

// PATCH: Overwrite all pattern templates for a specific ruleset
router.patch('/:ruleset', async (req, res) => {
  const connection = await pool.getConnection(); 
  try {
    const ruleset = req.params.ruleset.toUpperCase();
    const { classes } = req.body;

    await connection.beginTransaction();

   
    await connection.query('DELETE FROM pattern_templates WHERE ruleset = ?', [ruleset]);

    
    if (classes && classes.length > 0) {
      const insertValues = classes.map(c => [
        c.id,
        ruleset,
        c.ageGroup,
        c.gender,
        c.beltGroup,
        c.label,
        c.requiredPattern || null
      ]);

      await connection.query(`
        INSERT INTO pattern_templates 
        (id, ruleset, ageGroup, gender, beltGroup, label, requiredPattern) 
        VALUES ?
      `, [insertValues]);
    }

    await connection.commit();
    res.json({ success: true, message: `${ruleset} pattern templates saved successfully` });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving pattern templates:', error);
    res.status(500).json({ error: 'Failed to save pattern templates' });
  } finally {
    connection.release();
  }
});

export default router;