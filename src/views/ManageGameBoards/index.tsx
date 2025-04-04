import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@/components/CloseIcon';
import { Trans } from 'react-i18next';
import ImportExport from './ImportExport';
import { useState } from 'react';
import ToastAlert from '@/components/ToastAlert';
import { activateBoard, deleteBoard, getBoards, upsertBoard } from '@/stores/gameBoard';
import { useLiveQuery } from 'dexie-react-hooks';
import Accordion from '@/components/Accordion';
import AccordionSummary from '@/components/Accordion/Summary';
import AccordionDetails from '@/components/Accordion/Details';
import { AddCircle, Delete } from '@mui/icons-material';
import { t } from 'i18next';
import useLocalStorage from '@/hooks/useLocalStorage';
import useAuth from '@/context/hooks/useAuth';
import { getOrCreateBoard, sendMessage } from '@/services/firebase';
import { Settings } from '@/types/Settings';
import { AlertState } from '@/types';

interface GameBoardProps {
  open: boolean;
  close: () => void;
  isMobile: boolean;
}

export default function GameBoard({ open, close, isMobile }: GameBoardProps) {
  const gameBoards = useLiveQuery(getBoards);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<number>(0);
  const [expandedElement, setExpanded] = useState<number>(0);
  const settings = useLocalStorage('gameSettings')[0] as Settings;
  const { user } = useAuth();

  if (!gameBoards) {
    return null;
  }

  const getFinishRange = (tiles: any[]) => {
    const lastTile = tiles[tiles.length - 1];
    const percentageValues = lastTile.description.match(/\d+%/g);
    return percentageValues;
  };

  const handleSetAlert = (alert: AlertState) => {
    setAlert(alert);
  };

  async function createGameMessage({ title, tiles }: { title: string; tiles: any[] }) {
    const gameTileTitles = tiles.map(
      ({ title: tileTitle }: { title: string }) => `* ${tileTitle} \n`
    );
    // remove our start and finish tiles from the list.
    gameTileTitles.pop();
    gameTileTitles.shift();

    let message = `### ${t('activated')}: ${title}\n`;
    message += '---\n';
    message += [...new Set(gameTileTitles)].join(' ');
    message += '---\n';
    // get finishRange from the last tile.
    const finishRange = getFinishRange(tiles);
    if (finishRange.length === 3) {
      message += `* ${t('finishSlider')} ${finishRange[0]}  | ${finishRange[1]} | ${finishRange[2]}`;
    }

    const gameBoard = await getOrCreateBoard({
      title,
      gameBoard: JSON.stringify(tiles) as string,
      settings: JSON.stringify(settings) as string,
    });

    if (!gameBoard?.id) {
      return;
    }

    await sendMessage({
      room: settings?.room || 'PUBLIC',
      user,
      text: message,
      type: 'settings',
      gameBoardId: gameBoard.id,
      boardSize: tiles.length,
      gameMode: settings?.gameMode,
    });
  }

  const addBoard = async () => {
    const boardId = (await upsertBoard({ isActive: 0 })) || 0;
    setExpanded(boardId);
  };

  const enableBoard = (board: any) => {
    activateBoard(board.id);
    createGameMessage(board);
    setAlert({ message: t('boardEnabled'), type: 'success' });
  };

  const confirmDelete = (boardId: number) => {
    if (boardId === 0) return;
    setConfirmDialog(boardId);
  };

  const deleteGameBoard = () => {
    if (typeof confirmDialog === 'number') {
      deleteBoard(confirmDialog);
    }
    setConfirmDialog(0);
  };

  const handleExpand = (panel: number) => (_event: React.SyntheticEvent, newExpanded: boolean) => {
    setExpanded(newExpanded ? panel : 0);
  };

  const invalidBoard = (board: any) =>
    !board.tiles || board.tiles.length !== (settings?.roomTileCount || 40);

  const getSwitchTooltip = (board: any) => {
    if (invalidBoard(board)) {
      return t('boardWrongSize', { size: settings?.roomTileCount || 40 });
    }
    if (board.isActive) {
      return t('boardActive');
    }
    return t('enableBoard');
  };

  return (
    <>
      <Dialog
        fullScreen={isMobile}
        open={open}
        onClose={close}
        PaperProps={{
          sx: {
            maxHeight: '100%',
            height: '100%',
          },
        }}
      >
        <DialogTitle>
          <Trans i18nKey="manageGameBoards" />
          <CloseIcon close={close} />
        </DialogTitle>
        <DialogContent style={{ overflowY: 'scroll' }}>
          <Box sx={{ mb: 1 }}>
            <Button
              variant="outlined"
              onClick={addBoard}
              endIcon={<AddCircle />}
              sx={{ float: 'right' }}
            >
              <Trans i18nKey="add" />
            </Button>
            <Typography>
              <Trans i18nKey="gameBoardDescription" />
            </Typography>
          </Box>

          {gameBoards.map((board) => (
            <Accordion
              key={board.id}
              expanded={expandedElement === board.id}
              onChange={handleExpand(board.id || 0)}
            >
              <AccordionSummary>
                <Box>
                  <Typography variant="body1">{board.title}</Typography>
                  <Typography variant="body2">{board.tiles?.length} tiles</Typography>
                </Box>
                <Box style={{ marginLeft: 'auto' }} justifyContent="flex-end">
                  <Tooltip title={getSwitchTooltip(board)}>
                    <div style={{ display: 'inline-block' }}>
                      <Switch
                        checked={!!board.isActive}
                        disabled={!!board.isActive || invalidBoard(board)}
                        onChange={() => enableBoard(board)}
                        size="small"
                      />
                    </div>
                  </Tooltip>
                  <Tooltip title={t('delete')}>
                    <span style={{ display: 'inline-block' }}>
                      <IconButton onClick={() => confirmDelete(board.id || 0)} size="small" component="span">
                        <Delete color="error" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <ImportExport
                  open={open}
                  close={() => handleExpand(board.id || 0)(null as any, false)}
                  setAlert={handleSetAlert}
                  board={board}
                />
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
      </Dialog>
      <ToastAlert
        open={!!alert?.message}
        type={alert?.type || 'error'}
        close={() => setAlert(null)}
      >
        {alert?.message}
      </ToastAlert>
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(0)}>
        <DialogTitle>
          Delete Board
          <CloseIcon close={() => setConfirmDialog(0)} />
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete &quot;
            {gameBoards.find((board) => board.id === confirmDialog)?.title}
            &quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(0)}>Cancel</Button>
          <Button onClick={deleteGameBoard}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
