/* eslint-env node */
// Backend API routes for Google Cloud Text-to-Speech
// This should be deployed as serverless functions or Express.js routes

const textToSpeech = require('@google-cloud/text-to-speech');

// Initialize the Google Cloud TTS client
let ttsClient;

function initializeClient() {
  if (!ttsClient) {
    ttsClient = new textToSpeech.TextToSpeechClient({
      // Credentials will be set via environment variables or service account key
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Optional: path to service account key
    });
  }
  return ttsClient;
}

// POST /api/tts/synthesize
module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = initializeClient();
    const { text, voice, languageCode, audioEncoding, speakingRate, pitch, volumeGainDb } =
      req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Construct the request
    const request = {
      input: { text },
      voice: {
        languageCode: languageCode || 'en-US',
        name: voice || 'en-US-Neural2-D',
      },
      audioConfig: {
        audioEncoding: audioEncoding || 'MP3',
        speakingRate: speakingRate || 1.0,
        pitch: pitch || 0.0,
        volumeGainDb: volumeGainDb || 0.0,
      },
    };

    // Perform the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);

    // Set appropriate headers for audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', response.audioContent.length);

    // Send the audio content
    res.status(200).send(response.audioContent);
  } catch (error) {
    console.error('Google Cloud TTS error:', error);
    res.status(500).json({
      error: 'Text-to-speech synthesis failed',
      details: error.message,
    });
  }
};

// GET /api/tts/voices
module.exports.voicesHandler = async function voicesHandler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = initializeClient();
    const { languageCode } = req.query;

    // Construct the request
    const request = {};
    if (languageCode) {
      request.languageCode = languageCode;
    }

    // Perform the list voices request
    const [response] = await client.listVoices(request);

    // Transform voices to match our interface
    const voices = response.voices.map((voice) => ({
      name: voice.name,
      languageCode: voice.languageCodes[0],
      gender: voice.ssmlGender,
      displayName: `${voice.name} (${voice.ssmlGender})`,
      provider: 'google',
      quality: voice.name.includes('Neural2')
        ? 'neural2'
        : voice.name.includes('Wavenet')
          ? 'wavenet'
          : 'standard',
    }));

    res.status(200).json({ voices });
  } catch (error) {
    console.error('Failed to fetch Google Cloud voices:', error);
    res.status(500).json({
      error: 'Failed to fetch voices',
      details: error.message,
    });
  }
};
