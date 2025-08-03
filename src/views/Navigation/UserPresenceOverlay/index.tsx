import { Box, Typography, Popover, Chip } from '@mui/material';
import { useEffect, useRef } from 'react';
import TextAvatar from '@/components/TextAvatar';
import { useTranslation } from 'react-i18next';
import { Player } from '@/types/player';
import type { HybridPlayer } from '@/hooks/useHybridPlayerList';
import { isLocalPlayer } from '@/hooks/useHybridPlayerList';

interface PlayerWithLocation extends Player {
  location?: number;
}

interface UserPresenceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  playerList: (PlayerWithLocation | HybridPlayer)[];
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
            borderRadius: 2,
            boxShadow: 3,
            p: { xs: 1.5, sm: 2 },
            backgroundColor: 'background.paper',
          },
        },
      }}
      disableRestoreFocus
      disableEnforceFocus
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
          {/* Show different title for local vs online players */}
          {playerList.some((p) => 'isLocal' in p && isLocalPlayer(p as HybridPlayer))
            ? t('players')
            : t('online')}{' '}
          ({playerList.length})
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 1, sm: 1.5 },
            alignItems: 'flex-start',
          }}
        >
          {playerList.map((player) => {
            const isLocal = 'isLocal' in player && player.isLocal;
            const showLocalMode = playerList.some(
              (p) => 'isLocal' in p && isLocalPlayer(p as HybridPlayer)
            );

            return (
              <Box
                key={player.uid}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.75, sm: 1 },
                  width: 'auto',
                }}
              >
                <TextAvatar uid={player.uid} displayName={player.displayName} size="medium" />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                      color: player.isSelf ? 'primary.main' : 'text.primary',
                      fontWeight: player.isSelf ? 600 : 400,
                      whiteSpace: 'nowrap',
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
                  {isLocal && !showLocalMode && (
                    <Chip
                      label={t('localPlayer')}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{
                        fontSize: '0.625rem',
                        height: '16px',
                        alignSelf: 'flex-start',
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Popover>
  );
}
