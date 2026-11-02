import express from 'express';
import pool from '../server.js'; 

const router = express.Router();

// GET: Fetch templates for a specific ruleset (ITF or WT)
router.get('/:ruleset', async (req, res) => {
  try {
    const ruleset = req.params.ruleset.toUpperCase();
    
    
    const [rows] = await pool.query(`
      SELECT 
        id, 
        ruleset, 
        ageGroup, 
        gender, 
        label, 
        \`min\`, 
        \`max\` 
      FROM weight_templates 
      WHERE ruleset = ?
    `, [ruleset]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching weight templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// PATCH: Overwrite all templates for a specific ruleset
router.patch('/:ruleset', async (req, res) => {
  const connection = await pool.getConnection(); 
  try {
    const ruleset = req.params.ruleset.toUpperCase();
    const { classes } = req.body;

    await connection.beginTransaction();

    
    await connection.query('DELETE FROM weight_templates WHERE ruleset = ?', [ruleset]);

   
    if (classes && classes.length > 0) {
      const insertValues = classes.map(c => [
        c.id,
        ruleset,
        c.ageGroup,
        c.gender,
        c.label,
        parseFloat(c.min) || 0,
        parseFloat(c.max) || 999 // Fallback to 999 for "open" max weights
      ]);

      
      await connection.query(`
        INSERT INTO weight_templates 
        (id, ruleset, ageGroup, gender, label, \`min\`, \`max\`) 
        VALUES ?
      `, [insertValues]);
    }

    await connection.commit();
    res.json({ success: true, message: `${ruleset} weight templates saved successfully` });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving weight templates:', error);
    res.status(500).json({ error: 'Failed to save templates' });
  } finally {
    connection.release();
  }
});

export default router;