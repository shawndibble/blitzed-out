export function camelToPascal(text?: string): string {
  const word = text?.replace(/([A-Z])/g, ' $1').trim();
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function pascalToCamel(text: string): string {
  return text.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export function a11yProps(index: number): {
  id: string;
  'aria-controls': string;
} {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export function extractAction(message?: string): string | undefined {
  const textLines = message?.split(/\r?\n/) || [];
  return textLines[textLines.length - 1]?.split(':')[1];
}

export function extractTime(string: string, timeValue: string): string[] | undefined {
  const reg = new RegExp(`\\d+\\s${timeValue}`, 'g');
  return string.match(reg)?.filter((value, index, array) => array.indexOf(value) === index);
}

export function isPublicRoom(room?: string): boolean {
  return room?.toUpperCase() === 'PUBLIC';
}

// aka solo game mode.
export function isOnlineMode(gameMode: string): boolean {
  return gameMode === 'online';
}
