import express from 'express';
import { bookParticipant } from '../controllers/participant.controller';
import { SendBookingRequest } from '../types/participant.types';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('Received /sendbooking request body:', req.body);
    const { startTime, endTime, email, body } = req.body as SendBookingRequest;
    console.log('Parsed fields:', { startTime, endTime, email, body });
    if (!startTime || !endTime || !email || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const updated = await bookParticipant({ startTime, endTime, email, body });
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error in /sendbooking:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router; 