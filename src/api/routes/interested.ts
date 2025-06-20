import express from 'express';
import { createInterestedNotification } from '../controllers/notification.controller';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
      const { from_email, subject, body } = req.body;
      
      if (!from_email) {
        return res.status(400).json({ error: 'Email is required' });
      }
  
      const notification = await createInterestedNotification(from_email, subject, body);
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating interested notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

export default router; 