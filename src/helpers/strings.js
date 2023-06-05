export default function camelToPascal(text) {
  const word = text.replace(/([A-Z])/g, ' $1').trim();
  return word.charAt(0).toUpperCase() + word.slice(1);
}
