import CircleIcon from '@mui/icons-material/Circle';
import { ButtonBase } from '@mui/material';
import { ReactNode, forwardRef } from 'react';
import { Player } from '@/types/player';

interface PlayerWithLocation extends Player {
  location?: number;
}

interface PlayersOnlineProps {
  playerList: PlayerWithLocation[];
  onClick?: () => void;
  innerRef?: React.Ref<HTMLButtonElement>;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean;
  [key: string]: any;
}

const PlayersOnline = forwardRef<HTMLButtonElement, PlayersOnlineProps>(
  ({ playerList, onClick, innerRef, ...props }, ref): ReactNode => {
    // Use ref as the primary reference, fallback to innerRef for backward compatibility
    const combinedRef = ref || innerRef;

    if (onClick) {
      return (
        <ButtonBase
          {...props}
          ref={combinedRef}
          onClick={onClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: 1,
            px: 0.5,
            py: 0.25,
            minWidth: 44, // Minimum touch target
            minHeight: 44,
            color: 'text.primary',
            fontSize: 'inherit',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            '&:focus': {
              backgroundColor: 'action.focus',
            },
          }}
        >
          <CircleIcon color="success" sx={{ fontSize: 8, marginRight: '0.2rem' }} />
          {playerList.length}
        </ButtonBase>
      );
    }

    return (
      <div
        {...props}
        ref={combinedRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          color: 'var(--mui-palette-text-primary)',
          fontWeight: 500,
        }}
      >
        <CircleIcon color="success" sx={{ fontSize: 8, marginRight: '0.2rem' }} />
        {playerList.length}
      </div>
    );
  }
);

PlayersOnline.displayName = 'PlayersOnline';

export default PlayersOnline;
