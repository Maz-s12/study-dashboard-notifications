import express from 'express';
import { getEligibleParticipants } from '../controllers/participant.controller';

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

export default router; 