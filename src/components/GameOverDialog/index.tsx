import { Dialog, DialogContent, Grid, Typography } from '@mui/material';
import CloseIcon from '@/components/CloseIcon';
import GridItemActionCard from '@/components/GridItemActionCard';
import useBreakpoint from '@/hooks/useBreakpoint';
import useGameBoard from '@/hooks/useGameBoard';
import { useSettings } from '@/stores/settingsStore';
import useReturnToStart from '@/hooks/useReturnToStart';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { vibrate } from '@/utils/haptics';

interface GameOverDialogProps {
  isOpen?: boolean;
  close: () => void;
}

export default function GameOverDialog({
  isOpen = false,
  close,
}: GameOverDialogProps): JSX.Element {
  const { t } = useTranslation();
  const { id: room } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sentUserToStart = useReturnToStart();

  const isMobile = useBreakpoint();
  const updateGameBoardTiles = useGameBoard();
  const [settings] = useSettings();

  const returnToStart = useCallback(() => {
    if (settings?.hapticFeedback) {
      vibrate('short');
    }
    sentUserToStart();
    close();
  }, [sentUserToStart, close, settings?.hapticFeedback]);

  const rebuild = useCallback(async () => {
    if (settings?.hapticFeedback) {
      vibrate('short');
    }
    await updateGameBoardTiles({ ...settings, boardUpdated: true });
    sentUserToStart();
    close();
  }, [updateGameBoardTiles, settings, sentUserToStart, close]);

  const openSettings = useCallback(() => {
    if (settings?.hapticFeedback) {
      vibrate('short');
    }
    close();
    navigate(`/${(room || 'PUBLIC').toUpperCase()}/settings`);
  }, [close, navigate, room, settings?.hapticFeedback]);

  return (
    <Dialog open={isOpen} onClose={close} fullScreen={isMobile} aria-labelledby="modal-game-over">
      <DialogContent>
        <Typography
          variant="h4"
          sx={{
            textAlign: 'center',
            mb: 2,
            px: 2,
          }}
        >
          <Trans i18nKey="gameOverPlayAgain" />
        </Typography>
        <CloseIcon close={close} />

        <Grid
          container
          spacing={2}
          sx={{
            alignItems: 'stretch',
          }}
        >
          <GridItemActionCard title={t('sameBoard')} onClick={returnToStart}>
            <Trans i18nKey="sameBoardDescription" />
          </GridItemActionCard>

          <GridItemActionCard title={t('rebuildBoard')} onClick={rebuild}>
            <Trans i18nKey="rebuildBoardDescription" />
          </GridItemActionCard>

          <GridItemActionCard title={t('changeSettings')} onClick={openSettings}>
            <Trans i18nKey="changeSettingsDescription" />
          </GridItemActionCard>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
