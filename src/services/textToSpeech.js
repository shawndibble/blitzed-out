import languages from 'locales/languages.json';

export default function speak(message, language) {
  const utterance = new SpeechSynthesisUtterance();
  utterance.text = message;
  utterance.voice = window.speechSynthesis.getVoices()
    .find((v) => v.name === languages[language].voice);
  setTimeout(() => window.speechSynthesis.speak(utterance), 700);
}
