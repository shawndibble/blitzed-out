import { Avatar, Tooltip } from '@mui/material';

interface TextAvatarProps {
  uid: string;
  displayName: string;
  size?: 'small' | 'medium';
}

function contrastBgColor(bgColor: string, lightColor: string, darkColor: string): string {
  const color = bgColor.charAt(0) === '#' ? bgColor.substring(1, 7) : bgColor;
  const r = parseInt(color.substring(0, 2), 16); // hexToR
  const g = parseInt(color.substring(2, 4), 16); // hexToG
  const b = parseInt(color.substring(4, 6), 16); // hexToB
  return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? darkColor : lightColor;
}

function stringToColor(string: string): string {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

function stringAvatar(name: string, uid: string, size?: 'small' | 'medium') {
  const bgcolor = stringToColor(uid);
  const dimension = size === 'small' ? 18 : 24;
  const fontSize = size === 'small' ? 10 : 12;
  return {
    sx: {
      bgcolor,
      width: dimension,
      height: dimension,
      fontSize,
      color: contrastBgColor(bgcolor, '#FFFFFF', '#000000'),
    },
    children: `${name?.split(' ')[0]?.[0] || ''}${name?.split(' ')?.[1]?.[0] ?? ''}`,
  };
}

export default function TextAvatar({ uid, displayName, size }: TextAvatarProps): JSX.Element {
  return (
    <Tooltip title={displayName}>
      <Avatar {...stringAvatar(displayName, uid, size)} className="player-online" />
    </Tooltip>
  );
}
