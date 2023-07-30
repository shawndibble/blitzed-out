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
  const [textValue, setTextField] = useState('');
  const [alert, setAlert] = useState('');

  // eslint-disable-next-line consistent-return
  const importBoard = () => {
    let gameTiles = [];
    const entries = textValue.split('---').filter((e) => e);

    try {
      if (entries.length < 38) {
        throw setAlert(t('importTooShort', { entries: 38 - entries.length }));
      }
      if (entries.length > 38) {
        throw setAlert(t('importTooLong', { entries: entries.length - 38 }));
      }
      gameTiles = entries.map((entry, index) => {
        const [title, description] = entry.split('\n').filter((e) => e);

        if (title === undefined) {
          throw setAlert(t('importNoEmpty'));
        }

        const surroundedInBrackets = /^\[.+\]$/;
        if (!surroundedInBrackets.test(title)) {
          throw setAlert(t('importInvalidTitle', { entry: index + 1 }));
        }

        if (!description) {
          throw setAlert(t('importMissingDescription', { entry: index + 1 }));
        }

        return { title: title?.replace(/\[|\]/g, ''), description };
      });
    } catch (error) {
      return {};
    }

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
