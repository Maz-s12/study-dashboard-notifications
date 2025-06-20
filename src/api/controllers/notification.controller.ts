import db from '../../db/setup';
import { createParticipant, createOrUpdatePendingReviewParticipant, setParticipantEligible } from './participant.controller';
import { Notification } from '../types/notification.types';
import { format, parseISO } from 'date-fns';

export async function createInterestedNotification(
  email: string, 
  subject?: string, 
  body?: string
): Promise<Notification> {
  console.log('Creating notification for email:', email);
  
  const notification: Omit<Notification, 'id'> = {
    type: 'email_received',
    email,
    timestamp: new Date().toISOString(),
    status: 'pending',
    emailSubject: subject,
    emailBody: body
  };

  const stmt = db.prepare(`
    INSERT INTO notifications (type, email, timestamp, status, email_subject, email_body)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    notification.type,
    notification.email,
    notification.timestamp,
    notification.status,
    notification.emailSubject || null,
    notification.emailBody || null
  );

  const newNotification: Notification = {
    ...notification,
    id: result.lastInsertRowid as number
  };

  console.log('Created new notification:', newNotification);
  return newNotification;
}

export async function getNotifications(): Promise<Notification[]> {
  console.log('Fetching notifications...');
  const notifications = db.prepare(`
    SELECT 
      n.*,
      p.prescreen_approval_date
    FROM notifications n
    LEFT JOIN participants p ON n.email = p.email
    ORDER BY timestamp DESC
  `).all() as Notification[];

  // Parse the data field if it's a string
  notifications.forEach((n: any) => {
    if (typeof n.data === 'string') {
      try {
        n.data = JSON.parse(n.data);
      } catch {
        n.data = {};
      }
    }
  });

  console.log('Retrieved notifications:', notifications);
  console.log('Found', notifications.length, 'notifications');
  return notifications;
}

export async function approveEmailNotification(id: number): Promise<Notification> {
  console.log('Approving notification', id, '...');
  
  // First get the notification
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as Notification;
  console.log('Looking for notification with ID:', id);
  
  if (!notification) {
    console.error('Notification not found:', id);
    throw new Error('Notification not found');
  }
  
  console.log('Found notification:', notification);
  
  try {
    // Create or get existing participant
    console.log('Creating participant for email:', notification.email);
    await createParticipant(notification.email);
    
    // Update notification status
    console.log('Updating notification status to approved');
    const updateResult = db.prepare(`
      UPDATE notifications 
      SET status = 'approved' 
      WHERE id = ?
    `).run(id);
    
    console.log('Update result:', updateResult);
    
    if (updateResult.changes === 0) {
      throw new Error('Failed to update notification status');
    }

    // Send email via Power Automate webhook if configured
    if (process.env.POWER_AUTOMATE_WEBHOOK_URL) {
      try {
        console.log('Sending approval email via Power Automate webhook...');
        await fetch(process.env.POWER_AUTOMATE_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to_email: notification.email,
            notificationId: notification.id,
            status: 'approved',
            timestamp: new Date().toISOString(),
            template: 'interested_participant'
          })
        });
        console.log('Approval email sent.');
      } catch (err) {
        console.error('Failed to send approval email:', err);
      }
    } else {
      console.warn('Power Automate webhook URL not configured');
    }
    
    console.log('Notification approved successfully');
    return { ...notification, status: 'approved' };
  } catch (error) {
    console.error('Error approving notification:', error);
    throw error;
  }
}

export async function rejectEmailNotification(id: number): Promise<Notification> {
  console.log('Rejecting notification', id, '...');

  // First get the notification
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as Notification;
  console.log('Looking for notification with ID:', id);

  if (!notification) {
    console.error('Notification not found:', id);
    throw new Error('Notification not found');
  }

  console.log('Found notification:', notification);

  try {
    // Update notification status
    console.log('Updating notification status to rejected');
    const updateResult = db.prepare(`
      UPDATE notifications 
      SET status = 'rejected' 
      WHERE id = ?
    `).run(id);

    console.log('Update result:', updateResult);

    if (updateResult.changes === 0) {
      throw new Error('Failed to update notification status');
    }

    console.log('Notification rejected successfully');
    return { ...notification, status: 'rejected' };
  } catch (error) {
    console.error('Error rejecting notification:', error);
    throw error;
  }
}

export async function createPreScreenCompletedNotification(email: string, name: string, preScreenData: any): Promise<Notification> {
  console.log('Creating pre_screen_completed notification for email:', email, 'name:', name);

  // Check for existing notification for this email and type
  const existing = db.prepare(`SELECT * FROM notifications WHERE type = 'pre_screen_completed' AND email = ?`).get(email) as Notification | undefined;
  if (existing) {
    console.log('pre_screen_completed notification already exists for email:', email);
    return existing;
  }

  // Create or update participant
  await createOrUpdatePendingReviewParticipant(email, name, preScreenData);

  const notification: Omit<Notification, 'id'> = {
    type: 'pre_screen_completed',
    email,
    timestamp: new Date().toISOString(),
    status: 'pending',
    data: { name }
  };

  const stmt = db.prepare(`
    INSERT INTO notifications (type, email, timestamp, status, data)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    notification.type,
    notification.email,
    notification.timestamp,
    notification.status,
    JSON.stringify(notification.data)
  );

  const newNotification: Notification = {
    ...notification,
    id: result.lastInsertRowid as number
  };

  console.log('Created new pre_screen_completed notification:', newNotification);
  return newNotification;
}

export async function approvePreScreenCompletedNotification(id: number): Promise<Notification> {
  // Approve logic: set status to 'approved'
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as Notification;
  if (!notification) throw new Error('Notification not found');

  if (notification.status !== 'pending') {
    console.log('Notification already approved or rejected, skipping email send.');
    return { ...notification };
  }

  db.prepare(`UPDATE notifications SET status = 'approved' WHERE id = ?`).run(id);

  // Set participant status to eligible and add approval date
  const approvalDate = new Date().toISOString();
  db.prepare(`
    UPDATE participants 
    SET status = 'eligible', prescreen_approval_date = ? 
    WHERE email = ?
  `).run(approvalDate, notification.email);

  // Send eligible participant email via Power Automate webhook if configured
  if (process.env.POWER_AUTOMATE_WEBHOOK_URL) {
    try {
      console.log('Sending eligible participant email via Power Automate webhook...');
      await fetch(process.env.POWER_AUTOMATE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_email: notification.email,
          notificationId: notification.id,
          status: 'approved',
          timestamp: new Date().toISOString(),
          template: 'eligible_participant'
        })
      });
      console.log('Eligible participant email sent.');
    } catch (err) {
      console.error('Failed to send eligible participant email:', err);
    }
  } else {
    console.warn('Power Automate webhook URL not configured');
  }

  return { ...notification, status: 'approved' };
}

export async function rejectPreScreenCompletedNotification(id: number): Promise<Notification> {
  // Reject logic: set status to 'rejected'
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as Notification;
  if (!notification) throw new Error('Notification not found');

  if (notification.status !== 'pending') {
    console.log('Notification already approved or rejected, skipping email send.');
    return { ...notification };
  }

  db.prepare(`UPDATE notifications SET status = 'rejected' WHERE id = ?`).run(id);

  // Send non_eligible_participant email via Power Automate webhook if configured
  if (process.env.POWER_AUTOMATE_WEBHOOK_URL) {
    try {
      console.log('Sending non_eligible_participant email via Power Automate webhook...');
      await fetch(process.env.POWER_AUTOMATE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_email: notification.email,
          notificationId: notification.id,
          status: 'rejected',
          timestamp: new Date().toISOString(),
          template: 'non_eligible_participant'
        })
      });
      console.log('non_eligible_participant email sent.');
    } catch (err) {
      console.error('Failed to send non_eligible_participant email:', err);
    }
  } else {
    console.warn('Power Automate webhook URL not configured');
  }

  return { ...notification, status: 'rejected' };
}

export async function createBookingScheduledNotification({
  email,
  bookingTime,
  cancelLink,
  rescheduleLink,
  surveyLink,
  name,
  age,
  extraData
}: {
  email: string;
  bookingTime: string;
  cancelLink: string;
  rescheduleLink: string;
  surveyLink?: string;
  name?: string;
  age?: number;
  extraData?: any;
}): Promise<Notification> {
  const notification: Omit<Notification, 'id'> = {
    type: 'booking_scheduled',
    email,
    timestamp: new Date().toISOString(),
    status: 'pending',
    data: {
      bookingTime,
      cancelLink,
      rescheduleLink,
      surveyLink,
      name,
      age,
      ...extraData
    }
  };
  const stmt = db.prepare(`
    INSERT INTO notifications (type, email, timestamp, status, data)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    notification.type,
    notification.email,
    notification.timestamp,
    notification.status,
    JSON.stringify(notification.data)
  );
  const newNotification: Notification = {
    ...notification,
    id: result.lastInsertRowid as number
  };
  console.log('Created new booking_scheduled notification:', newNotification);
  return newNotification;
}

export async function approveBookingScheduledNotification(id: number): Promise<Notification> {
  // Approve logic: set status to 'approved' for booking_scheduled
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as Notification;
  if (!notification) throw new Error('Notification not found');

  if (notification.type !== 'booking_scheduled') {
    throw new Error('Notification is not of type booking_scheduled');
  }

  if (notification.status !== 'pending') {
    console.log('Notification already approved or rejected, skipping webhook.');
    return { ...notification };
  }

  db.prepare(`UPDATE notifications SET status = 'approved' WHERE id = ?`).run(id);

  // Prepare booking date fields
  let booking_date = '';
  let booking_day = '';
  let booking_time = '';
  try {
    let data = notification.data;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    if (data && data.bookingTime) {
      const dateObj = parseISO(data.bookingTime);
      booking_date = format(dateObj, 'MMMM d'); // e.g. June 13
      booking_day = format(dateObj, 'EEEE'); // e.g. Monday
      booking_time = format(dateObj, 'hh:mmaaa').toLowerCase(); // e.g. 01:30pm
    }
  } catch (err) {
    console.error('Error parsing booking date fields:', err);
  }

  // Send booking confirmation email via Power Automate webhook if configured
  if (process.env.POWER_AUTOMATE_WEBHOOK_URL) {
    try {
      console.log('Sending booking confirmation via Power Automate webhook...');
      await fetch(process.env.POWER_AUTOMATE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_email: notification.email,
          notificationId: notification.id,
          status: 'approved',
          timestamp: new Date().toISOString(),
          template: 'booking_confirmation',
          booking_date,
          booking_day,
          booking_time
        })
      });
      console.log('Booking confirmation sent.');
    } catch (err) {
      console.error('Failed to send booking confirmation:', err);
    }
  } else {
    console.warn('Power Automate webhook URL not configured');
  }

  return { ...notification, status: 'approved' };
} 