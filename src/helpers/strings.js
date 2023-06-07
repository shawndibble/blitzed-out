export function camelToPascal(text) {
  const word = text?.replace(/([A-Z])/g, ' $1').trim();
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
