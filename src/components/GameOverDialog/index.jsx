import { Dialog, DialogContent, DialogTitle, Grid2, Typography } from '@mui/material';
import CloseIcon from '@/components/CloseIcon';
import GridItemActionCard from '@/components/GridItemActionCard';
import useBreakpoint from '@/hooks/useBreakpoint';
import useGameBoard from '@/hooks/useGameBoard';
import useLocalStorage from '@/hooks/useLocalStorage';
import useReturnToStart from '@/hooks/useReturnToStart';
import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import GameSettings from '@/views/GameSettings';
import { Settings } from '@/types/Settings';

interface GameOverDialogProps {
  isOpen?: boolean;
  close: () => void;
}

export default function GameOverDialog({ isOpen = false, close }: GameOverDialogProps): JSX.Element {
  const { t } = useTranslation();
  const [openSettingsDialog, setSettingsDialog] = useState<boolean>(false);
  const sentUserToStart = useReturnToStart();

  const isMobile = useBreakpoint();
  const updateGameBoardTiles = useGameBoard();
  const [settings, updateLocalStorage] = useLocalStorage<Settings>('gameSettings');

  const returnToStart = useCallback(() => {
    sentUserToStart();
    close();
  }, [sentUserToStart, close]);

  const rebuild = useCallback(async () => {
    await updateGameBoardTiles({ ...settings, boardUpdated: true });
    sentUserToStart();
    close();
  }, [updateGameBoardTiles, settings, sentUserToStart, close]);

  const acceleratedDifficulty = useCallback(async () => {
    const newSettings = {
      ...settings,
      boardUpdated: true,
      difficulty: 'accelerated',
    };
    await updateGameBoardTiles(newSettings);
    updateLocalStorage(newSettings);
    sentUserToStart();
    close();
  }, [updateGameBoardTiles, settings, updateLocalStorage, sentUserToStart, close]);

  const openSettings = useCallback(() => {
    setSettingsDialog(true);
    close();
  }, [close]);

  const closeSettings = useCallback(() => {
    setSettingsDialog(false);
    sentUserToStart();
  }, [sentUserToStart]);

  return (
    <>
      <Dialog open={isOpen} onClose={close} fullScreen={isMobile} aria-labelledby="modal-game-over">
        <DialogContent>
          <Typography variant="h4" textAlign="center" sx={{ mb: 2, px: 2 }}>
            <Trans i18nKey="gameOverPlayAgain" />
          </Typography>
          <CloseIcon close={close} />

          <Grid2 container spacing={2} alignItems="stretch">
            <GridItemActionCard title={t('sameBoard')} onClick={returnToStart}>
              <Trans i18nKey="sameBoardDescription" />
            </GridItemActionCard>

            <GridItemActionCard title={t('rebuildBoard')} onClick={rebuild}>
              <Trans i18nKey="rebuildBoardDescription" />
            </GridItemActionCard>

            <GridItemActionCard
              title={t('finalDifficulty')}
              onClick={acceleratedDifficulty}
              disabled={settings.difficulty === 'accelerated'}
            >
              <Trans i18nKey="finalDifficultyDescription" />
            </GridItemActionCard>

            <GridItemActionCard title={t('changeSettings')} onClick={openSettings}>
              <Trans i18nKey="changeSettingsDescription" />
            </GridItemActionCard>
          </Grid2>
        </DialogContent>
      </Dialog>

      {!!openSettingsDialog && (
        <Dialog fullScreen={isMobile} open={openSettingsDialog} maxWidth="md">
          <DialogTitle>
            <Trans i18nKey="gameSettings" />
            <CloseIcon close={closeSettings} />
          </DialogTitle>
          <DialogContent>
            <GameSettings closeDialog={closeSettings} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
