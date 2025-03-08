// /pages/api/tts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAudioUrl } from 'google-tts-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text } = req.query;
  if (!text || typeof text !== 'string') {
    res.status(400).send('Missing text query');
    return;
  }
  
  try {
    // Generate the Google TTS URL for the provided text
    const url = getAudioUrl(text, { lang: 'en', slow: false, host: 'https://translate.google.com' });
    
    // Fetch the audio from Google
    const audioResponse = await fetch(url);
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio');
    }
    const audioBuffer = await audioResponse.arrayBuffer();
    
    // Set the appropriate headers and send the audio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (error) {
    res.status(500).json({ error: (error as Error).toString() });
  }
}
