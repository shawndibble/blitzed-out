import languages from 'locales/languages.json';

export default function speak(message, language) {
  const utterance = new SpeechSynthesisUtterance();
  utterance.text = message;

  const setVoiceAndSpeak = () => {
    utterance.voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.name === languages[language].voice);
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
  } else {
    setVoiceAndSpeak();
  }
}
