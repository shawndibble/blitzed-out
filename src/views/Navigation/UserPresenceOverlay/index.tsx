import { Box, Typography, Popover } from '@mui/material';
import { useEffect, useRef } from 'react';
import TextAvatar from '@/components/TextAvatar';
import { useTranslation } from 'react-i18next';

interface Player {
  uid: string;
  displayName: string;
  location?: number;
  isSelf?: boolean;
}

interface UserPresenceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  playerList: Player[];
  anchorEl: HTMLElement | null;
}

export default function UserPresenceOverlay({
  isOpen,
  onClose,
  playerList,
  anchorEl,
}: UserPresenceOverlayProps): JSX.Element {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isOpen]);

  return (
    <Popover
      open={isOpen}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      sx={{ zIndex: 1300 }}
      slotProps={{
        paper: {
          sx: {
            maxWidth: { xs: '95vw', sm: '90vw', md: '400px' },
            minWidth: { xs: 260, sm: 280, md: 320 },
            borderRadius: 2,
            boxShadow: 3,
            p: { xs: 1.5, sm: 2 },
            backgroundColor: 'background.paper',
          },
        },
      }}
    >
      <Box
        ref={contentRef}
        role="dialog"
        aria-label={t('online')}
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1.5,
            color: 'text.secondary',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {t('online')} ({playerList.length})
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 1, sm: 1.5 },
            alignItems: 'center',
            justifyContent: { xs: 'center', sm: 'flex-start' },
          }}
        >
          {playerList.map((player) => (
            <Box
              key={player.uid}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.75, sm: 1 },
                minWidth: 0, // Allow text to truncate
                flex: { xs: '1 1 auto', sm: '0 0 auto' },
                maxWidth: { xs: '100%', sm: 'none' },
              }}
            >
              <TextAvatar uid={player.uid} displayName={player.displayName} size="medium" />
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                  color: player.isSelf ? 'primary.main' : 'text.primary',
                  fontWeight: player.isSelf ? 600 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: { xs: 100, sm: 120 },
                }}
              >
                {player.displayName}
                {player.isSelf && (
                  <Typography
                    component="span"
                    sx={{
                      ml: 0.5,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      color: 'text.secondary',
                    }}
                  >
                    ({t('you')})
                  </Typography>
                )}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Popover>
  );
}
