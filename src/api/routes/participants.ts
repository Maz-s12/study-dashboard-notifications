import express from 'express';
import { getEligibleParticipants, getBookings } from '../controllers/participant.controller';
import db from '../../db/setup';

const router = express.Router();

router.get('/eligible', async (req, res) => {
  try {
    const participants = await getEligibleParticipants();
    res.status(200).json(participants);
  } catch (error: any) {
    console.error('Error fetching eligible participants:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/bookings', async (req, res) => {
  try {
    const bookings = await getBookings();
    res.status(200).json(bookings);
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Temporary seeding endpoint (remove after use)
router.post('/seed', async (req, res) => {
  try {
    const { participants } = req.body;
    
    if (!Array.isArray(participants)) {
      return res.status(400).json({ error: 'Participants must be an array' });
    }

    for (const participant of participants) {
      db.prepare(`
        INSERT OR REPLACE INTO participants 
        (email, status, name, age, pre_screen_data, created_at, prescreen_approval_date, survey_link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        participant.email,
        participant.status,
        participant.name,
        participant.age,
        participant.pre_screen_data,
        participant.created_at,
        participant.prescreen_approval_date,
        participant.survey_link
      );
    }

    res.status(200).json({ message: `Imported ${participants.length} participants` });
  } catch (error: any) {
    console.error('Error seeding participants:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router; 