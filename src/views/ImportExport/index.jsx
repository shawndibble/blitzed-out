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
import useAuth from 'hooks/useAuth';
import useLocalStorage from 'hooks/useLocalStorage';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { sendMessage } from 'services/firebase';

export default function ImportExport({ open, close, isMobile }) {
  const { t } = useTranslation();
  const [localGameBoard, setLocalGameBoard] = useLocalStorage('customBoard');
  const settings = useLocalStorage('gameSettings')[0];
  const [textValue, setTextField] = useState('');
  const [alert, setAlert] = useState('');
  const { user } = useAuth();

  // default is 40 tiles. If room is private, use roomTileCount.
  const { room, roomTileCount } = settings;
  const requiredTiles = room === 'public' ? 40 : roomTileCount;

  async function createGameMessage(gameTiles, importLabel) {
    const gameTileTitles = gameTiles.map(({ title }) => `* ${title}`);
    // remove our start and finish tiles from the list.
    gameTileTitles.pop();
    gameTileTitles.shift();

    let message = `### ${t('importedGameboard')}\n\n`;
    if (importLabel) {
      message += `${t('title')}: ${importLabel.join('\n')}\n\n`;
    }
    message += `${t('boardIncludesFollowing')}\n`;
    message += [...new Set(gameTileTitles)].join('\n');

    await sendMessage({
      room: room || 'public',
      user,
      text: message,
      type: 'settings',
      gameBoard: JSON.stringify(gameTiles),
      settings: JSON.stringify(settings),
    });
  }

  // eslint-disable-next-line consistent-return
  const importBoard = async () => {
    let gameTiles = [];
    const importLabel = textValue.match(/#.*/g).map((e) => e.replace('#', '').trim());
    const entries = textValue
      .split('\n')
      .filter((line) => !line.startsWith('#')) // remove all comments.
      .join('\n')
      .split('---')
      .filter((e) => e);

    try {
      if (entries.length < requiredTiles) {
        throw setAlert(t('importTooShort', { entries: requiredTiles - entries.length }));
      }
      if (entries.length > requiredTiles) {
        throw setAlert(t('importTooLong', { entries: entries.length - requiredTiles }));
      }
      gameTiles = entries.map((entry, index) => {
        const [title, ...description] = entry.split('\n').filter((e) => e);

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

        return { title: title?.replace(/\[|\]/g, ''), description: description.join('\n') };
      });
    } catch (error) {
      // return nothing. Just wait for setAlert to output the error message.
      return null;
    }

    // if we have an alert that wasn't caught by our try-catch. Should still stop importing.
    if (alert) return null;

    setLocalGameBoard(gameTiles);

    await createGameMessage(gameTiles, importLabel);

    close();
  };

  const exportBoard = () => {
    const arrayExport = localGameBoard.map(({ title, description }) => `[${title}]\n${description}`);
    const boardString = arrayExport.join('\n---\n');
    const stringExport = `# ${t('userCustomBoard', { displayName: user.displayName })}\n\n${boardString}`;

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
