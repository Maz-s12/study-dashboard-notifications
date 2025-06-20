import path from 'path';
import dotenv from 'dotenv';
import cron from 'node-cron';
import axios from 'axios';
import { debugPrintAllParticipants } from './api/controllers/participant.controller';
// Load environment variables first
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env file from:', envPath);
dotenv.config({ path: envPath });

// Log environment variables status
console.log('Environment variables loaded:');
console.log('POWER_AUTOMATE_WEBHOOK_URL:', process.env.POWER_AUTOMATE_WEBHOOK_URL ? 'Configured' : 'Not configured');
console.log('PORT:', process.env.PORT || '5000');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('SURVEYMONKEY_TOKEN:', process.env.SURVEYMONKEY_TOKEN ? 'Configured' : 'Not configured');
console.log('SURVEY_ID:', process.env.SURVEY_ID ? 'Configured' : 'Not configured');

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import apiRoutes from './api/routes';
import interestedRoutes from './api/routes/interested';
import sendBookingRoutes from './api/routes/sendbooking';
import { createInterestedNotification, getNotifications, approveEmailNotification, createPreScreenCompletedNotification } from './api/controllers/notification.controller';
import { createParticipant } from './api/controllers/participant.controller';
import { SurveyMonkeyResponse } from './api/types/notification.types';
import { authMiddleware } from './middleware/auth';

const app = express();

// CORS configuration - allow all origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? true // Allow all origins in production
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
  console.log('----------------------------------------');
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('----------------------------------------');
  next();
});

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Public routes (if any) go here
app.use('/api/interested', interestedRoutes);
app.use('/api/sendbooking', sendBookingRoutes);

app.post('/api/login', (req, res) => {
  // Handle login if needed (Firebase handles this client-side)
  res.json({ message: 'Login route' });
});

// Protected routes
app.use('/api', authMiddleware);

// API Routes
app.use('/api', apiRoutes);

// Serve static files from the React app build directory in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  
  // Serve static files
  app.use(express.static(clientBuildPath));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// 404 handler (only for API routes in production, since React handles frontend routing)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({ error: 'Not Found', path: req.url });
  });
}

// --- SurveyMonkey Polling Job ---
const SURVEYMONKEY_TOKEN = process.env.SURVEYMONKEY_TOKEN;
const SURVEY_ID = process.env.SURVEY_ID;

// Store processed response IDs in memory (for demo; use DB/cache for production)
const processedSurveyResponseIds = new Set<string>();

async function fetchSurveyMonkeyResponses() {
  if (!SURVEYMONKEY_TOKEN || !SURVEY_ID) {
    console.warn('SURVEYMONKEY_TOKEN or SURVEY_ID not set. Skipping SurveyMonkey polling.');
    return;
  }
  try {
    const url = `https://api.surveymonkey.ca/v3/surveys/${SURVEY_ID}/responses/bulk`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${SURVEYMONKEY_TOKEN}`,
        Accept: 'application/json',
      },
      params: {
        status: 'completed',
        per_page: 1000
      }
    });
    const responses: SurveyMonkeyResponse[] = res.data.data || [];
    for (const response of responses) {
      if (response.response_status === 'completed' && !processedSurveyResponseIds.has(response.id)) {
        // Extract name and email from the response
        let name = '';
        let email = '';
        for (const page of response.pages) {
          for (const question of page.questions) {
            for (const answer of question.answers) {
              // Heuristic: look for email
              if (!email && answer.text && answer.text.includes('@')) {
                email = answer.text;
              }
              // Heuristic: look for name (first non-email text answer)
              if (!name && answer.text && !answer.text.includes('@')) {
                name = answer.text;
              }
            }
          }
        }
        if (email) {
          await createPreScreenCompletedNotification(email, name, response);
          processedSurveyResponseIds.add(response.id);
          console.log(`Created pre_screen_completed notification for SurveyMonkey response ${response.id}`);
        } else {
          console.warn(`Could not extract email from SurveyMonkey response ${response.id}`);
        }
      }
    }
  } catch (err) {
    console.error('Error fetching SurveyMonkey responses:', err);
  }
}

// Run every hour
cron.schedule('0 * * * *', fetchSurveyMonkeyResponses);
// Optionally run once on startup
fetchSurveyMonkeyResponses();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for all origins with credentials`);
});