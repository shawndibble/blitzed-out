import { FileDownload, FileUpload, Save, Share } from '@mui/icons-material';
import { Button, IconButton, TextField, Tooltip } from '@mui/material';
import CopyToClipboard from '@/components/CopyToClipboard';
import { useEffect, useState, ChangeEvent, FocusEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { updateBoard } from '@/stores/gameBoard';
import { DBGameBoard, TileExport } from '@/types/gameBoard';
import { AlertState } from '@/types';
import { downloadTextFile, readTextFile } from '@/utils/importExportFiles';

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
  const [textValue, setTextValue] = useState<string>('');
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

    setTextValue(arrayExport?.join('\n~~\n') || '');
  };

  const downloadBoard = (): void => {
    if (!textValue.trim()) {
      setAlert({
        message: t('enterDataToExport', 'Nothing to download yet.'),
        type: 'error',
      });
      return;
    }

    const filename = `${(boardTitle || 'game-board').replace(/[^\w-]+/g, '-').toLowerCase()}.txt`;
    downloadTextFile(textValue, filename);
  };

  const uploadBoardFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileText = await readTextFile(file);
      setTextValue(fileText);
      setAlert({
        message: t('importBoardFileLoaded', 'Import file loaded. Review it, then save.'),
        type: 'success',
      });
    } catch (error) {
      setAlert({
        message: `File read failed: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error',
      });
    } finally {
      event.target.value = '';
    }
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
  }, [open]);

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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        <Button variant="outlined" component="label" startIcon={<FileUpload />}>
          {t('uploadFile', 'Upload file')}
          <input type="file" accept=".txt,text/plain" hidden onChange={uploadBoardFile} />
        </Button>
        <Button variant="outlined" startIcon={<FileDownload />} onClick={downloadBoard}>
          {t('downloadFile', 'Download file')}
        </Button>
      </div>
      <TextField
        sx={{ mt: 2 }}
        multiline
        fullWidth
        value={textValue}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setTextValue(event.target.value)}
        slotProps={{
          input: {
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
                  <IconButton size="small" onClick={importBoard} aria-label={t('save')}>
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
          },
        }}
      />
    </>
  );
}
