import { Save, Share } from '@mui/icons-material';
import { IconButton, TextField, Tooltip } from '@mui/material';
import CopyToClipboard from '@/components/CopyToClipboard';
import { useEffect, useState, ChangeEvent, FocusEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { updateBoard } from '@/stores/gameBoard';
import { DBGameBoard, TileExport } from '@/types/gameBoard';
import { AlertState } from '@/types';

interface ImportExportProps {
  open: boolean;
  close: () => void;
  setAlert: (alert: AlertState) => void;
  board: DBGameBoard;
}

export default function ImportExport({
  open,
  close,
  setAlert,
  board,
}: ImportExportProps): JSX.Element {
  const { t } = useTranslation();
  const [textValue, setTextField] = useState<string>('');
  const [boardTitle, setBoardTitle] = useState<string>(board.title || '');

  function getGameTiles(entries: string[]): TileExport[] | null {
    try {
      if (!boardTitle.length) {
        setAlert({
          message: t('importTitleRequired'),
        });
        return null;
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
    } catch {
      // return nothing. Just wait for setAlert to output the error message.
      return null;
    }
  }

  const importBoard = async (): Promise<null> => {
    const entries = textValue
      .split(/~+/) // ~~~ separates each tile.
      .filter((e) => e);

    const gameTiles = getGameTiles(entries);

    // if we got nothing from getGameTiles, then we have an error message and should stop.
    if (!gameTiles) return null;

    try {
      if (JSON.stringify(board.tiles) === JSON.stringify(gameTiles)) {
        setAlert({
          message: t('importNoChange'),
        });
        return null;
      }
    } catch {
      setAlert({
        message: t('error'),
        type: 'error',
      });
      return null;
    }

    updateBoard({ ...board, title: boardTitle, tiles: gameTiles });

    setAlert({
      message: t('saved'),
      type: 'success',
    });

    close();
    return null;
  };

  const exportBoard = (): void => {
    // Guard against null/undefined tiles and properties
    const arrayExport = board?.tiles
      ?.map((tile) => {
        if (!tile) return '';
        const title = tile.title || '';
        const description = tile.description || '';
        return `[${title}]\n${description}`;
      })
      .filter(Boolean);

    setTextField(arrayExport?.join('\n~~\n') || '');
  };

  const changeTitle = (event: ChangeEvent<HTMLInputElement>): void => {
    setBoardTitle(event.target.value);
  };

  const saveTitle = async (event: FocusEvent<HTMLInputElement>): Promise<null | undefined> => {
    if (!event.target.value.length) {
      setAlert({ message: t('importTitleRequired') });
      return null;
    }
    updateBoard({ ...board, title: event.target.value });
    return undefined;
  };

  useEffect(() => {
    if (open) {
      exportBoard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Removed board dependency to avoid circular reference

  // Sync boardTitle state with board.title prop when it changes
  useEffect(() => {
    setBoardTitle(board.title || '');
  }, [board.title]);

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
        onChange={(event: ChangeEvent<HTMLInputElement>) => setTextField(event.target.value)}
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
                <IconButton
                  size="small"
                  onClick={importBoard}
                  title={t('save')}
                  aria-label={t('save')}
                >
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
