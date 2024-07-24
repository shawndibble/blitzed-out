import { Save, Share } from '@mui/icons-material';
import { IconButton, TextField, Tooltip } from '@mui/material';
import CopyToClipboard from 'components/CopyToClipboard';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateBoard } from 'stores/gameBoard';

export default function ImportExport({ open, close, setAlert, board }) {
  const { t } = useTranslation();
  const [textValue, setTextField] = useState('');
  const [boardTitle, setBoardTitle] = useState(board.title);

  function getGameTiles(entries) {
    try {
      if (!boardTitle.length) {
        return setAlert({
          message: t('importTitleRequired'),
        });
      }
      return entries.map((entry, index) => {
        const [title, ...description] = entry.split('\n').filter((e) => e);

        if (title === undefined) {
          throw setAlert({
            message: t('importNoEmpty'),
          });
        }

        const surroundedInBrackets = /^\[.+\]$/;
        if (!surroundedInBrackets.test(title)) {
          throw setAlert({
            message: t('importInvalidTitle', { entry: index + 1 }),
          });
        }

        if (!description.length) {
          throw setAlert({
            message: t('importMissingDescription', { entry: index + 1 }),
          });
        }

        return {
          title: title?.replace(/\[|\]/g, ''),
          description: description.join('\n'),
        };
      });
    } catch (error) {
      // return nothing. Just wait for setAlert to output the error message.
      return null;
    }
  }

  const importBoard = async () => {
    const entries = textValue
      .split(/~+/) // ~~~ separates each tile.
      .filter((e) => e);

    const gameTiles = getGameTiles(entries);

    // if we got nothing from getGameTiles, then we have an error message and should stop.
    if (!gameTiles) return null;

    if (JSON.stringify(board.tiles) === JSON.stringify(gameTiles)) {
      return setAlert({
        message: t('importNoChange'),
      });
    }

    updateBoard({ ...board, title: boardTitle, tiles: gameTiles });

    setAlert({
      message: t('saved'),
      type: 'success',
    });

    close();
  };

  const exportBoard = () => {
    const arrayExport = board?.tiles?.map(
      ({ title, description }) => `[${title}]\n${description}`
    );

    setTextField(arrayExport?.join('\n~~\n'));
  };

  const changeTitle = (event) => {
    setBoardTitle(event.target.value);
  };

  const saveTitle = async (event) => {
    if (!event.target.value.length) {
      return setAlert({
        message: t('importTitleRequired'),
      });
    }
    updateBoard({ ...board, title: event.target.value });
  };

  useEffect(() => {
    if (open) {
      exportBoard();
    }
  }, [open]);

  return (
    <>
      <TextField
        fullWidth
        label={t('title')}
        value={boardTitle}
        onChange={changeTitle}
        onBlur={saveTitle}
      />
      <TextField
        sx={{ mt: 2 }}
        multiline
        fullWidth
        value={textValue}
        onChange={(event) => setTextField(event.target.value)}
        InputProps={{
          endAdornment: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: 0,
              }}
            >
              <Tooltip title={t('save')}>
                <IconButton size="small" onClick={importBoard}>
                  <Save color="success" />
                </IconButton>
              </Tooltip>
              <CopyToClipboard text={textValue} />
              <CopyToClipboard
                text={`${window.location.href}?importBoard=${board.id}`}
                copiedText={t('copiedLink')}
                icon={<Share />}
                tooltip={t('copyShareLink')}
              />
            </div>
          ),
          sx: { alignItems: 'flex-start' },
        }}
      />
    </>
  );
}
