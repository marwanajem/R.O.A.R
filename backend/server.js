import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import competitorRoutes from './routes/competitors.js';
import teamRoutes from './routes/teams.js';
dotenv.config();

const app = express();

app.use(cors({
  origin: ['https://roarchampionship.com', 'http://localhost:5173'], 
  credentials: true
}));

app.use(express.json());

// database connection 
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// test the database connection 
pool.getConnection()
  .then((connection) => {
    console.log('success');
    connection.release();
  })
  .catch((err) => {
    console.error('failed:', err.message);
  });


app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/teams', teamRoutes);
// test route
app.get('/api/status', (req, res) => {
  res.json({ message:  ' API is running securely' });
});


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


export default pool;