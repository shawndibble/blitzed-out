import CircleIcon from '@mui/icons-material/Circle';
import React, { ReactNode } from 'react';

interface Player {
  uid: string;
  displayName: string;
  location?: number;
  isSelf?: boolean;
}

interface PlayersOnlineProps {
  playerList: Player[];
  innerRef?: React.Ref<HTMLDivElement>;
  [key: string]: any;
}

export default function PlayersOnline({ playerList, innerRef, ...props }: PlayersOnlineProps): ReactNode {
  return (
    <div {...props} ref={innerRef}>
      <CircleIcon color="success" sx={{ fontSize: 8, marginRight: '0.2rem' }} />
      {playerList.length}
    </div>
  );
}
