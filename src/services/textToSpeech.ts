import { languages } from './importLocales';

export default function speak(message: string, language: string): void {
  const utterance = new SpeechSynthesisUtterance();
  utterance.text = message;

  // Set a lower pitch for a deeper voice
  utterance.pitch = 0.5; // Range 0-2, lower values = deeper voice

  const setVoiceAndSpeak = (): void => {
    const voices = window.speechSynthesis.getVoices();

    // Define preferred male voices in order of preference
    const preferredVoices = [
      'Google UK English Male',
      'Microsoft David - English (United States)',
      'Microsoft Mark - English (United States)',
      'Microsoft George - English (United Kingdom)',
      'Daniel', // Safari deep male voice
    ];

    // First try to find the voice specified in languages config
    let voice = voices.find((v) => v.name === languages[language]?.voice);

    // If not found or if it sounds feminine, try to find a preferred male voice
    if (!voice) {
      // Try each preferred voice in order
      for (const preferredVoice of preferredVoices) {
        const foundVoice = voices.find((v) => v.name === preferredVoice);
        if (foundVoice) {
          voice = foundVoice;
          break;
        }
      }

      // If still no voice found, try to find any male voice
      if (!voice) {
        voice = voices.find(
          (v) =>
            v.name.toLowerCase().includes('male') ||
            v.name.includes('David') ||
            v.name.includes('Mark') ||
            v.name.includes('George') ||
            v.name.includes('Daniel')
        );
      }

      // Last resort - just use the first voice
      if (!voice && voices.length > 0) {
        voice = voices[0];
      }
    }

    if (voice) {
      utterance.voice = voice;
      console.log(`Using voice: ${voice.name}`);
    }

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
  } else {
    setVoiceAndSpeak();
  }
}
