# Railway Deployment Guide

## Prerequisites

1. Create a Railway account at [railway.app](https://railway.app)
2. Install Railway CLI (optional): `npm install -g @railway/cli`

## Deployment Steps

### 1. Prepare Your Repository

Make sure your repository is pushed to GitHub, GitLab, or another Git provider.

### 2. Deploy to Railway

#### Option A: Using Railway Dashboard (Recommended)
1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account and select your repository
5. Railway will automatically detect the configuration and start building

#### Option B: Using Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. Configure Environment Variables

In your Railway project dashboard, go to the "Variables" tab and add the following environment variables:

#### Required Variables:
```
NODE_ENV=production
PORT=5000
```

#### Server-side Firebase Configuration (Required):
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url
```

#### Client-side Firebase Configuration (Required):
```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

#### Optional Variables:
```
SURVEYMONKEY_TOKEN=your-surveymonkey-token
SURVEY_ID=your-survey-id
POWER_AUTOMATE_WEBHOOK_URL=your-power-automate-webhook-url
```

### 4. Get Firebase Configuration

#### For Server-side (Service Account):
1. Go to your Firebase Console
2. Navigate to Project Settings > Service Accounts
3. Click "Generate new private key"
4. Download the JSON file
5. Copy the values from the JSON file to your Railway environment variables

#### For Client-side (Web App):
1. Go to your Firebase Console
2. Navigate to Project Settings > General
3. Scroll down to "Your apps" section
4. Click on your web app (or create one if it doesn't exist)
5. Copy the configuration values to your Railway environment variables

### 5. Deploy

Railway will automatically build and deploy your application. You can monitor the build process in the Railway dashboard.

### 6. Access Your Application

Once deployed, Railway will provide you with a URL where your application is accessible.

## Important Notes

- The application uses SQLite for the database, which is stored in the filesystem. For production, consider using a proper database service.
- Make sure all environment variables are properly set in Railway.
- The application will serve both the API and the React frontend from the same domain.
- Health checks are configured at `/api/health` endpoint.
- Client-side Firebase configuration must be prefixed with `REACT_APP_` for Create React App to recognize them.

## Troubleshooting

1. **Build fails**: Check the build logs in Railway dashboard
2. **Environment variables not working**: Ensure all variables are set in Railway dashboard
3. **Database issues**: SQLite file might not persist between deployments. Consider using a proper database service.
4. **CORS issues**: The application is configured to allow all origins in production.
5. **Firebase authentication not working**: Make sure both server-side and client-side Firebase configurations are correct.

## Custom Domain (Optional)

You can add a custom domain in the Railway dashboard under the "Settings" tab of your project. 