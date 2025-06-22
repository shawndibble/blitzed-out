import { Dialog, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import CloseIcon from '@/components/CloseIcon';
import GridItemActionCard from '@/components/GridItemActionCard';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useGameSettingsStore } from '@/stores/gameSettings';
import useRoomNavigate from '@/hooks/useRoomNavigate';
import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

interface GameOverDialogProps {
  open: boolean;
  onClose: () => void;
  winner?: string;
}

export default function GameOverDialog({
  open,
  onClose,
}: GameOverDialogProps): JSX.Element {
  const { t } = useTranslation();
  const navigate = useRoomNavigate();
  const updateSettings = useGameSettingsStore((state) => state.updateSettings);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);

  const returnToStart = useCallback(() => {
    navigate('/start');
    onClose();
  }, [navigate, onClose]);

  const playAgain = useCallback(async () => {
    updateSettings({ boardUpdated: true });
    onClose();
  }, [updateSettings, onClose]);

  const handleNewGame = useCallback(async () => {
    updateSettings({ boardUpdated: false });
    onClose();
  }, [updateSettings, onClose]);

  const acceleratedDifficulty = useCallback(async () => {
    updateSettings({ boardUpdated: true });
    onClose();
  }, [updateSettings, onClose]);

  const openSettingsHandler = useCallback(() => {
    setOpenSettingsDialog(true);
    onClose();
  }, [onClose]);

  const closeSettings = useCallback(() => {
    setOpenSettingsDialog(false);
    navigate('/start');
  }, [navigate]);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullScreen={useBreakpoint()} aria-labelledby="modal-game-over">
        <DialogContent>
          <Typography variant="h4" textAlign="center" sx={{ mb: 2, px: 2 }}>
            <Trans i18nKey="gameOverPlayAgain" />
          </Typography>
          <CloseIcon close={onClose} />

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <GridItemActionCard title={t('newGame')} onClick={handleNewGame}>
              <Trans i18nKey="sameBoardDescription" />
            </GridItemActionCard>
            
            <GridItemActionCard title={t('playAgain')} onClick={playAgain}>
              <Trans i18nKey="rebuildBoardDescription" />
            </GridItemActionCard>
            
            <GridItemActionCard title={t('accelerated')} onClick={acceleratedDifficulty}>
              <Trans i18nKey="finalDifficultyDescription" />
            </GridItemActionCard>
            
            <GridItemActionCard title={t('settings')} onClick={openSettingsHandler}>
              <Trans i18nKey="changeSettingsDescription" />
            </GridItemActionCard>
            
            <GridItemActionCard title={t('returnToStart')} onClick={returnToStart}>
              <Trans i18nKey="sameBoardDescription" />
            </GridItemActionCard>
          </Grid>
        </DialogContent>
      </Dialog>

      {openSettingsDialog && (
        <Dialog fullScreen={useBreakpoint()} open={openSettingsDialog} maxWidth="md">
          <DialogTitle>
            <Trans i18nKey="gameSettings" />
            <CloseIcon close={closeSettings} />
          </DialogTitle>
        </Dialog>
      )}
    </>
  );
}
