import { languages } from './importLocales';

export default function speak(message: string, language: string): void {
  const utterance = new SpeechSynthesisUtterance();
  utterance.text = message;

  const setVoiceAndSpeak = (): void => {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.name === languages[language]?.voice);
    if (voice) {
      utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
  } else {
    setVoiceAndSpeak();
  }
}
