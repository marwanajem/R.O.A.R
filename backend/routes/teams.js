import express from 'express';
import pool from '../server.js'; 

const router = express.Router();

// GET: Fetch teams and their members (mapped to athleteIds for the frontend)
router.get('/event/:eventId/club/:clubCode', async (req, res) => {
  try {
    const { eventId, clubCode } = req.params;
    
    const [teams] = await pool.query(
      "SELECT * FROM teams WHERE eventId = ? AND clubCode = ? ORDER BY created_at ASC",
      [eventId, clubCode]
    );

    const [members] = await pool.query(
      `SELECT tm.teamId, c.athleteId 
       FROM team_members tm
       JOIN teams t ON tm.teamId = t.id
       JOIN competitors c ON tm.competitorId = c.id
       WHERE t.eventId = ? AND t.clubCode = ?`,
      [eventId, clubCode]
    );

    const formattedTeams = teams.map(team => {
      const teamRoster = members.filter(m => m.teamId === team.id).map(m => m.athleteId);
      return {
        ...team,
        members: teamRoster 
      };
    });

    res.json(formattedTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST: Create a new team instantly from Master Roster athletes
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { eventId, clubCode, name, type, gender, ageCategory, members } = req.body;
    
    await connection.beginTransaction();
   
    const [teamResult] = await connection.query(
      `INSERT INTO teams (eventId, clubCode, name, type, gender, ageCategory, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'confirmed')`,
      [eventId, clubCode, name, type, gender, ageCategory]
    );
    const newTeamId = teamResult.insertId;

    if (members && members.length > 0) {
      for (const athleteId of members) {
        
        const [existingComp] = await connection.query(
          'SELECT id FROM competitors WHERE eventId = ? AND athleteId = ? LIMIT 1',
          [eventId, athleteId]
        );

        let compId;

        if (existingComp.length > 0) {
          compId = existingComp[0].id;
        } else {
          const [athletes] = await connection.query('SELECT * FROM athletes WHERE id = ?', [athleteId]);
          
          if (athletes.length > 0) {
            const a = athletes[0];
            const icMasked = a.icNumber.length === 12 ? `${a.icNumber.substring(0,6)}-**-****` : a.icNumber.substring(0,4) + '****';
            
            const [insertComp] = await connection.query(`
              INSERT INTO competitors (eventId, athleteId, clubCode, fullName, icMasked, gender, dob, beltGrade, weightKg, isSparring, isPattern, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
            `, [eventId, athleteId, a.clubCode, a.fullName, icMasked, a.gender, a.dob, a.beltGrade, a.weightKg, a.isSparring, a.isPattern]);
            
            compId = insertComp.insertId;
          }
        }

        if (compId) {
          await connection.query(
            'INSERT INTO team_members (teamId, competitorId) VALUES (?, ?)', 
            [newTeamId, compId]
          );
        }
      }
    }

    await connection.commit();
    res.status(201).json({ message: 'Team registered successfully', id: newTeamId });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding team:', error);
    res.status(500).json({ error: 'Failed to add team' });
  } finally {
    connection.release();
  }
});

// PUT: Update an existing team
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const teamId = req.params.id;
    const { name, type, gender, ageCategory, members } = req.body;
    
    await connection.beginTransaction();

    await connection.query(
      `UPDATE teams SET name = ?, type = ?, gender = ?, ageCategory = ? WHERE id = ?`,
      [name, type, gender, ageCategory, teamId]
    );

    await connection.query('DELETE FROM team_members WHERE teamId = ?', [teamId]);

    if (members && members.length > 0) {
      
      // FETCH EVENT ID FIRST SO WE DON'T CRASH!
      const [teamInfo] = await connection.query('SELECT eventId FROM teams WHERE id = ?', [teamId]);
      const currentEventId = teamInfo[0].eventId;

      for (const athleteId of members) {
        const [existingComp] = await connection.query(
          'SELECT id FROM competitors WHERE eventId = ? AND athleteId = ? LIMIT 1',
          [currentEventId, athleteId] 
        );

        let compId;
        if (existingComp.length > 0) {
          compId = existingComp[0].id;
        } else {
          const [athletes] = await connection.query('SELECT * FROM athletes WHERE id = ?', [athleteId]);
          if (athletes.length > 0) {
            const a = athletes[0];
            const icMasked = a.icNumber.length === 12 ? `${a.icNumber.substring(0,6)}-**-****` : a.icNumber.substring(0,4) + '****';
            
            const [insertComp] = await connection.query(`
              INSERT INTO competitors (eventId, athleteId, clubCode, fullName, icMasked, gender, dob, beltGrade, weightKg, isSparring, isPattern, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
            `, [currentEventId, athleteId, a.clubCode, a.fullName, icMasked, a.gender, a.dob, a.beltGrade, a.weightKg, a.isSparring, a.isPattern]);
            
            compId = insertComp.insertId;
          }
        }

        if (compId) {
          await connection.query(
            'INSERT INTO team_members (teamId, competitorId) VALUES (?, ?)', 
            [teamId, compId]
          );
        }
      }
    }

    await connection.commit();
    res.status(200).json({ message: 'Team updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  } finally {
    connection.release();
  }
});

export default router;