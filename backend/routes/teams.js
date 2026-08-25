import express from 'express';
import pool from '../server.js'; 

const router = express.Router();


router.get('/event/:eventId/club/:clubCode', async (req, res) => {
  try {
    const { eventId, clubCode } = req.params;
    
    
    const [teams] = await pool.query(
      'SELECT * FROM teams WHERE eventId = ? AND clubCode = ? ORDER BY created_at ASC',
      [eventId, clubCode]
    );


    const [members] = await pool.query(
      `SELECT tm.teamId, tm.competitorId 
       FROM team_members tm
       JOIN teams t ON tm.teamId = t.id
       WHERE t.eventId = ? AND t.clubCode = ?`,
      [eventId, clubCode]
    );

  
    const formattedTeams = teams.map(team => {
   
      const teamRoster = members.filter(m => m.teamId === team.id).map(m => m.competitorId);
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


router.post('/', async (req, res) => {
  try {
    const { eventId, clubCode, name, type, gender, ageCategory, members } = req.body;
   
    const [teamResult] = await pool.query(
      `INSERT INTO teams (eventId, clubCode, name, type, gender, ageCategory, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [eventId, clubCode, name, type, gender, ageCategory]
    );
    
    const newTeamId = teamResult.insertId;

   
    if (members && members.length > 0) {
      for (const compId of members) {
        await pool.query(
          'INSERT INTO team_members (teamId, competitorId) VALUES (?, ?)', 
          [newTeamId, compId]
        );
      }
    }

    res.status(201).json({ message: 'Team added successfully', id: newTeamId });
  } catch (error) {
    console.error('Error adding team:', error);
    res.status(500).json({ error: 'Failed to add team' });
  }
});

export default router;