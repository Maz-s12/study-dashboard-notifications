import db from '../../db/setup';
import { InterestedParticipant, SendBookingRequest } from '../types/participant.types';
import { getFormattedSurveyResponse } from '../services/surveymonkey.service';
import { DateTime } from 'luxon';
import { createBookingScheduledNotification } from './notification.controller';

// Get webhook URL from environment variables
const POWER_AUTOMATE_WEBHOOK_URL = process.env.POWER_AUTOMATE_WEBHOOK_URL;
console.log('Participant Controller - Webhook URL:', POWER_AUTOMATE_WEBHOOK_URL ? 'Configured' : 'Not configured');
if (!POWER_AUTOMATE_WEBHOOK_URL) {
  console.warn('WARNING: POWER_AUTOMATE_WEBHOOK_URL is not configured in environment variables');
}

export async function createParticipant(email: string): Promise<InterestedParticipant> {
  // First check if participant already exists
  const existingParticipant = db.prepare('SELECT * FROM participants WHERE email = ?').get(email);
  
  if (existingParticipant) {
    console.log('Participant already exists:', existingParticipant);
    return existingParticipant as InterestedParticipant;
  }

  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO participants (email, status, created_at)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(
    email,
    'interested',
    createdAt
  );

  const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(result.lastInsertRowid) as InterestedParticipant;

  // Call Power Automate webhook if URL is configured
  if (POWER_AUTOMATE_WEBHOOK_URL) {
    try {
      console.log('Calling Power Automate webhook with URL:', POWER_AUTOMATE_WEBHOOK_URL);
      const response = await fetch(POWER_AUTOMATE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_email: participant.email,
          participantId: participant.id,
          status: participant.status,
          timestamp: participant.createdAt,
          template: "interested_participant"
        })
      });

      if (!response.ok) {
        console.error('Failed to trigger Power Automate workflow:', await response.text());
      } else {
        console.log('Successfully triggered Power Automate workflow');
      }
    } catch (error) {
      console.error('Error calling Power Automate webhook:', error);
    }
  } else {
    console.warn('Power Automate webhook URL not configured');
  }

  return participant;
}

export async function getParticipants(): Promise<any[]> {
  const stmt = db.prepare('SELECT * FROM participants ORDER BY created_at DESC');
  return stmt.all();
}

export async function createOrUpdatePendingReviewParticipant(email: string, name: string, preScreenData: any): Promise<any> {
  // Extract first and last name and age from formatted survey response
  let fullName = name;
  let age: number | null = null;
  let surveyLink: string | undefined = undefined;
  if (preScreenData) {
    try {
      const formatted = await getFormattedSurveyResponse(preScreenData);
      let foundFirstName = '';
      let foundLastName = '';
      let nameCount = 0;
      for (const qa of formatted) {
        const q = qa.questionText.toLowerCase();
        if (q.includes('provide your name')) {
          nameCount++;
          if (nameCount === 1) foundFirstName = qa.answerText;
          else if (nameCount === 2) foundLastName = qa.answerText;
        }
        if (age === null && q.includes('age')) {
          const parsed = parseFloat(qa.answerText);
          if (!isNaN(parsed)) age = parsed;
        }
      }
      if (foundFirstName || foundLastName) {
        fullName = `${foundFirstName} ${foundLastName}`.trim();
      }
      // Extract survey link from SurveyMonkey response
      if (preScreenData && preScreenData.analyze_url) {
        surveyLink = preScreenData.analyze_url;
      }
    } catch (err) {
      console.error('Error formatting survey response for name/age extraction:', err);
    }
  }
  let participant = db.prepare('SELECT * FROM participants WHERE email = ?').get(email) as any;
  if (participant) {
    // Update existing participant, preserve surveyLink if already set
    const existingSurveyLink = participant.survey_link || surveyLink;
    db.prepare(`UPDATE participants SET status = 'pending_review', name = ?, age = ?, pre_screen_data = ?, survey_link = ? WHERE email = ?`).run(fullName, age, JSON.stringify(preScreenData), existingSurveyLink, email);
    participant = db.prepare('SELECT * FROM participants WHERE email = ?').get(email) as any;
  } else {
    // Insert new participant
    db.prepare(`INSERT INTO participants (email, status, name, age, pre_screen_data, created_at, survey_link) VALUES (?, 'pending_review', ?, ?, ?, ?, ?)`).run(email, fullName, age, JSON.stringify(preScreenData), new Date().toISOString(), surveyLink);
    participant = db.prepare('SELECT * FROM participants WHERE email = ?').get(email) as any;
  }
  return participant;
}

export async function debugPrintAllParticipants(): Promise<void> {
  const participants = await getParticipants();
  console.log('All participants:', participants);
}

export async function getEligibleParticipants(): Promise<any[]> {
  const stmt = db.prepare(`
    SELECT id, name, pre_screen_data, prescreen_approval_date 
    FROM participants 
    WHERE status = 'eligible' AND booking_time IS NULL
    ORDER BY prescreen_approval_date DESC
  `);
  return stmt.all();
}

export async function createBooking(notificationData: any): Promise<any> {
  const { email, bookingTime, cancelLink, rescheduleLink, surveyLink, name, bookingTimeEst } = notificationData;
  
  // Get participant ID
  const participant = db.prepare('SELECT id FROM participants WHERE email = ?').get(email) as any;
  if (!participant || !participant.id) {
    throw new Error('Participant not found');
  }

  const stmt = db.prepare(`
    INSERT INTO bookings (participant_id, email, name, booking_time, booking_time_est, cancel_link, reschedule_link, survey_link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    participant.id,
    email,
    name,
    bookingTime,
    bookingTimeEst,
    cancelLink,
    rescheduleLink,
    surveyLink,
    new Date().toISOString()
  );

  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);
}

export async function getBookings(): Promise<any[]> {
  const stmt = db.prepare(`
    SELECT b.*, p.name as participant_name, p.email as participant_email
    FROM bookings b
    LEFT JOIN participants p ON b.participant_id = p.id
    ORDER BY b.booking_time DESC
  `);
  return stmt.all();
}

export async function setParticipantEligible(email: string): Promise<void> {
  // Preserve survey link and pre_screen_data when updating status
  const participant = db.prepare('SELECT * FROM participants WHERE email = ?').get(email) as any;
  if (participant) {
    db.prepare(`UPDATE participants SET status = 'eligible', prescreen_approval_date = ?, survey_link = ?, pre_screen_data = ? WHERE email = ?`)
      .run(new Date().toISOString(), participant.survey_link, participant.pre_screen_data, email);
  }
}

export async function bookParticipant({ startTime, endTime, email, body }: SendBookingRequest): Promise<any> {
  // Sanitize email
  const cleanEmail = email.trim().replace(/;+$/, '');

  // Parse cancel and reschedule links from body
  let cancelLink = '';
  let rescheduleLink = '';
  const cancelMatch = body.match(/Cancel:[^<]*<a [^>]*href=["']([^"']+)["']/i);
  if (cancelMatch) cancelLink = cancelMatch[1];
  const rescheduleMatch = body.match(/Reschedule:[^<]*<a [^>]*href=["']([^"']+)["']/i);
  if (rescheduleMatch) rescheduleLink = rescheduleMatch[1];

  // Log parsed links
  console.log('Parsed cancelLink:', cancelLink);
  console.log('Parsed rescheduleLink:', rescheduleLink);

  // Convert UTC startTime to EST (US/Eastern)
  const dtUtc = DateTime.fromISO(startTime, { zone: 'utc' });
  const dtEst = dtUtc.setZone('America/New_York');
  const bookingTimeUtc = dtUtc.toISO();
  const bookingTimeEst = dtEst.toISO();
  console.log('Parsed bookingTimeUtc:', bookingTimeUtc);
  console.log('Parsed bookingTimeEst:', bookingTimeEst);

  // Placeholder for survey link
  const surveyLink = 'SURVEY_LINK_PLACEHOLDER';

  // Update participant to booked, preserve survey link
  const participant = db.prepare('SELECT * FROM participants WHERE email = ?').get(cleanEmail) as any;
  if (!participant) {
    throw new Error('Participant not found');
  }
  // Add booking_time_est column if not exists
  try {
    db.prepare('ALTER TABLE participants ADD COLUMN booking_time_est TEXT').run();
  } catch (e) {}
  db.prepare(`UPDATE participants SET status = 'booked', booking_time = ?, booking_time_est = ?, cancel_link = ?, reschedule_link = ?, survey_link = ? WHERE email = ?`).run(
    bookingTimeUtc,
    bookingTimeEst,
    cancelLink,
    rescheduleLink,
    participant.survey_link,
    cleanEmail
  );
  const updatedParticipant = db.prepare('SELECT * FROM participants WHERE email = ?').get(cleanEmail) as any;

  // Create booking_scheduled notification
  await createBookingScheduledNotification({
    email: cleanEmail,
    bookingTime: bookingTimeEst ?? '',
    cancelLink,
    rescheduleLink,
    surveyLink: updatedParticipant.survey_link,
    name: updatedParticipant.name,
    age: updatedParticipant.age,
    extraData: { bookingTimeUtc }
  });
  return updatedParticipant;
} 