import express from 'express';
import pool from '../server.js'; 

const router = express.Router();

// GET: Fetch global templates for a specific ruleset (ITF or WT)
router.get('/:ruleset', async (req, res) => {
  try {
    const [templates] = await pool.query(
      'SELECT * FROM weight_templates WHERE ruleset = ?',
      [req.params.ruleset]
    );
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});


router.patch('/:ruleset', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const ruleset = req.params.ruleset;
    const { classes } = req.body;

    await connection.beginTransaction();

    
    await connection.query('DELETE FROM weight_templates WHERE ruleset = ?', [ruleset]);

    if (classes && classes.length > 0) {
      const insertValues = classes.map(c => [
        c.id, ruleset, c.ageGroup, c.gender, c.label, c.min, c.max
      ]);
      await connection.query(`
        INSERT INTO weight_templates (id, ruleset, ageGroup, gender, label, min, max)
        VALUES ?
      `, [insertValues]);
    }

    await connection.commit();
    res.json({ success: true, message: 'Templates saved successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving templates:', error);
    res.status(500).json({ error: 'Failed to save templates' });
  } finally {
    connection.release();
  }
});

export default router;