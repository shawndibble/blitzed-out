import { ContentCopy } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from 'components/CloseIcon';
import ToastAlert from 'components/ToastAlert';
import useLocalStorage from 'hooks/useLocalStorage';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

export default function ImportExport({ open, close, isMobile }) {
  const { t } = useTranslation();
  const [localGameBoard, setLocalGameBoard] = useLocalStorage('customBoard');
  const { room, roomTileCount } = useLocalStorage('gameSettings')[0];
  const [textValue, setTextField] = useState('');
  const [alert, setAlert] = useState('');

  // default is 40 tiles, but we don't count the start and finish tiles.
  // Also, why we sub 2 from roomTileCount.
  const requiredTiles = room === 'public' ? 38 : roomTileCount - 2;

  // eslint-disable-next-line consistent-return
  const importBoard = () => {
    let gameTiles = [];
    const entries = textValue.split('---').filter((e) => e);

    if (entries.length < requiredTiles) {
      return setAlert(t('importTooShort', { entries: requiredTiles - entries.length }));
    }
    if (entries.length > requiredTiles) {
      return setAlert(t('importTooLong', { entries: entries.length - requiredTiles }));
    }
    gameTiles = entries.map((entry, index) => {
      const [title, description] = entry.split('\n').filter((e) => e);

      if (title === undefined) {
        return setAlert(t('importNoEmpty'));
      }

      const surroundedInBrackets = /^\[.+\]$/;
      if (!surroundedInBrackets.test(title)) {
        return setAlert(t('importInvalidTitle', { entry: index + 1 }));
      }

      if (!description) {
        return setAlert(t('importMissingDescription', { entry: index + 1 }));
      }

      return { title: title?.replace(/\[|\]/g, ''), description };
    });

    if (alert) return null;

    gameTiles.unshift({ title: '', description: t('start') });
    gameTiles.push({ title: '', description: t('finish') });

    setLocalGameBoard(gameTiles);
    close();
  };

  const exportBoard = () => {
    const arrayExport = localGameBoard.map(({ title, description }) => `[${title}]\n${description}`);
    arrayExport.shift();
    arrayExport.pop();

    const stringExport = arrayExport.join('\n---\n');
    setTextField(stringExport);
  };

  const copyToClipboard = () => navigator.clipboard.writeText(textValue);

  useEffect(() => {
    if (open) {
      exportBoard();
    }
  }, [open]);

  return (
    <>
      <Dialog
        fullScreen={isMobile}
        open={open}
        onClose={close}
      >
        <DialogTitle>
          <Trans i18nKey="importExport" />
          <CloseIcon close={close} />
        </DialogTitle>
        <DialogContent sx={{ width: '30rem' }}>
          <Typography variant="body1"><Trans i18nKey="importExportDesc" /></Typography>
          <TextField
            sx={{ mt: 2 }}
            multiline
            fullWidth
            value={textValue}
            onChange={(event) => setTextField(event.target.value)}
            InputProps={{
              endAdornment: (
                <Tooltip title={t('copyToClipboard')}>
                  <IconButton onClick={copyToClipboard}>
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              ),
              sx: { alignItems: 'flex-start' },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={importBoard}><Trans i18nKey="import" /></Button>
        </DialogActions>
      </Dialog>
      <ToastAlert open={!!alert} setOpen={setAlert} close={() => setAlert(null)}>
        {alert}
      </ToastAlert>
    </>
  );
}
