import languages from 'locales/languages.json';

export default function speak(message, language) {
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance();
    utterance.voice = window.speechSynthesis.getVoices()
      .find((v) => v.name === languages[language].voice);
    utterance.text = message;
    window.speechSynthesis.speak(utterance);
  }, 700);
}
