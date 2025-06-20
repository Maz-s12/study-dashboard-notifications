import express from 'express';
import { approveEmailNotification, getNotifications, rejectEmailNotification, approvePreScreenCompletedNotification, rejectPreScreenCompletedNotification, approveBookingScheduledNotification } from '../controllers/notification.controller';
import { getFormattedSurveyResponse } from '../services/surveymonkey.service';
import db from '../../db/setup';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    console.log('Fetching notifications...');
    const notifications = await getNotifications();
    console.log(`Found ${notifications.length} notifications`);
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ 
      error: 'Failed to get notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    // Fetch notification to check type
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notificationId) as any;
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    let result;
    if (notification.type === 'booking_scheduled') {
      result = await approveBookingScheduledNotification(notificationId);
    } else {
      result = await approveEmailNotification(notificationId);
    }
    res.json(result);
  } catch (error) {
    console.error('Error approving notification:', error);
    res.status(500).json({ 
      error: 'Failed to approve notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    console.log(`Rejecting notification ${notificationId}...`);
    const result = await rejectEmailNotification(notificationId);
    console.log('Notification rejected successfully');
    res.json(result);
  } catch (error) {
    console.error('Error rejecting notification:', error);
    res.status(500).json({ 
      error: 'Failed to reject notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/:id/approve-pre-screen', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    const result = await approvePreScreenCompletedNotification(notificationId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve pre_screen_completed notification', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/:id/reject-pre-screen', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    const result = await rejectPreScreenCompletedNotification(notificationId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject pre_screen_completed notification', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/:id/survey-response', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    // Get the notification
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notificationId) as any;
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Get the participant to access pre_screen_data
    const participant = db.prepare('SELECT * FROM participants WHERE email = ?').get(notification.email) as any;
    if (!participant || !participant.pre_screen_data) {
      return res.status(404).json({ error: 'Survey response data not found' });
    }

    // Parse the pre_screen_data
    const responseData = JSON.parse(participant.pre_screen_data);
    
    // Get formatted survey response
    const formattedResponse = await getFormattedSurveyResponse(responseData);
    
    res.json(formattedResponse);
  } catch (error) {
    console.error('Error getting survey response:', error);
    res.status(500).json({ 
      error: 'Failed to get survey response', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router; 