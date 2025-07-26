# Google Cloud Text-to-Speech Setup Guide

This guide will help you set up Google Cloud Text-to-Speech integration for the blitzed-out application.

## Overview

The application now uses **Google Cloud Text-to-Speech** for high-quality neural voices with automatic fallback to the browser's Web Speech API. This provides:

- ✅ **High-quality Neural2 voices** (much better than browser voices)
- ✅ **4M characters/month free tier** (generous usage limits)
- ✅ **Multilingual support** with native speakers
- ✅ **Automatic fallback** to browser voices if Google Cloud is unavailable
- ✅ **Professional audio quality** suitable for production use

## Step-by-Step Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click "Create Project" or select existing project
4. Choose a project name (e.g., "blitzed-out-tts")
5. Note your **Project ID** (you'll need this later)

### 2. Enable Text-to-Speech API

1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Cloud Text-to-Speech API"
3. Click on it and press "Enable"
4. Wait for the API to be enabled

### 3. Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter details:
   - **Name**: `blitzed-out-tts`
   - **Description**: `Text-to-speech service for blitzed-out app`
4. Click "Create and Continue"

### 4. Assign Permissions

1. In the "Grant this service account access to project" section:
2. Add role: **"Cloud Text-to-Speech User"**
3. Click "Continue" then "Done"

### 5. Create and Download Key

1. Click on your newly created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose **JSON** format
5. Click "Create" - a JSON file will download
6. **⚠️ Keep this file secure!** It contains your credentials

### 6. Configure Your Application

#### Option A: Environment Variables (Recommended)

1. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your configuration:

   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=./path/to/your-service-account-key.json
   ```

3. Place your service account JSON file in a secure location (e.g., `./credentials/` folder)

#### Option B: Direct Key File Path

1. Set the key file path directly:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_KEY_FILE=./credentials/service-account-key.json
   ```

### 7. Deploy Backend API

The application requires backend API endpoints to handle Google Cloud TTS securely. You have several deployment options:

#### Option A: Vercel (Recommended for this project)

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Deploy the API:

   ```bash
   vercel --prod
   ```

3. Add environment variables in Vercel dashboard:
   - `GOOGLE_CLOUD_PROJECT_ID`
   - `GOOGLE_APPLICATION_CREDENTIALS` (upload the JSON content)

#### Option B: Netlify Functions

1. Move `api/tts.js` to `netlify/functions/`
2. Deploy with Netlify CLI or Git integration

#### Option C: Express.js Server

1. Create a simple Express server:

   ```javascript
   const express = require('express');
   const ttsHandler = require('./api/tts');

   const app = express();
   app.use(express.json());

   app.post('/api/tts/synthesize', ttsHandler);
   app.get('/api/tts/voices', ttsHandler.voicesHandler);

   app.listen(3001, () => console.log('TTS API running on port 3001'));
   ```

### 8. Update Frontend Configuration

If your API is deployed to a different domain, update the base URL:

```env
REACT_APP_TTS_API_BASE_URL=https://your-api-domain.com/api/tts
```

### 9. Test the Integration

1. Start your development server:

   ```bash
   npm start
   ```

2. Go to Settings > App Settings > Sounds
3. Enable "Read my rolls actions"
4. You should see a voice dropdown with Google Cloud voices (marked with 🌩️)
5. Test the sample playback button
6. Try different voices and languages

## Verification Checklist

- [ ] Google Cloud project created
- [ ] Text-to-Speech API enabled
- [ ] Service account created with proper permissions
- [ ] JSON key file downloaded and secured
- [ ] Environment variables configured
- [ ] Backend API deployed and accessible
- [ ] Voice selection shows Google Cloud voices
- [ ] Sample playback works with high-quality audio
- [ ] Fallback to browser voices works when offline

## Troubleshooting

### Common Issues

**"Authentication failed"**

- Check your service account key file path
- Verify environment variables are set correctly
- Ensure service account has "Cloud Text-to-Speech User" role

**"API not enabled"**

- Enable the Cloud Text-to-Speech API in Google Cloud Console
- Wait a few minutes for propagation

**"Quota exceeded"**

- Check your usage in Google Cloud Console
- The free tier includes 4M characters/month
- Consider upgrading if needed

**"CORS errors"**

- Ensure your backend API includes proper CORS headers
- Check that the API endpoints are accessible from your frontend domain

### Fallback Behavior

If Google Cloud TTS fails for any reason, the application automatically falls back to:

1. Browser's Web Speech API (if available)
2. Silent operation (no audio) with error logging

This ensures the game continues to work even if the cloud service is unavailable.

## Usage Monitoring

Monitor your usage in Google Cloud Console:

1. Go to "APIs & Services" > "Credentials"
2. Check the "Quotas" section
3. View usage statistics and set up alerts

The free tier (4M characters/month) is quite generous for most applications.

## Security Best Practices

- ✅ **Never commit** service account keys to version control
- ✅ **Use environment variables** for all credentials
- ✅ **Rotate keys periodically** (every 90 days recommended)
- ✅ **Use least-privilege permissions** (only Text-to-Speech User role)
- ✅ **Monitor usage** to detect unexpected activity

## Cost Management

- **Free Tier**: 4M characters/month
- **Paid Tier**: $4.00 per 1M characters (Standard voices), $16.00 per 1M characters (Neural2 voices)
- **Monitoring**: Set up billing alerts in Google Cloud Console

For most gaming applications, the free tier should be sufficient.
