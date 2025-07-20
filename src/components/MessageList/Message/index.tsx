import { Box, Button, Divider, Typography } from '@mui/material';
import clsx from 'clsx';
import DeleteMessageButton from '@/components/DeleteMessageButton';
import GameOverDialog from '@/components/GameOverDialog';
import TextAvatar from '@/components/TextAvatar';
import moment from 'moment';
import { useCallback, useState, useMemo, memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import remarkGemoji from 'remark-gemoji';
import CopyToClipboard from '@/components/CopyToClipboard';
import { Share } from '@mui/icons-material';
import ActionText from './actionText';
import { Message as MessageType } from '@/types/Message';
import { Timestamp } from 'firebase/firestore';

const MILLISECONDS_IN_A_MINUTE = 60000;

interface MessageProps {
  message: MessageType;
  isOwnMessage: boolean;
  isTransparent?: boolean;
  currentGameBoardSize?: number;
  room: string;
}

function Message({
  message,
  isOwnMessage,
  isTransparent,
  currentGameBoardSize = 40,
  room,
}: MessageProps): JSX.Element {
  const { t } = useTranslation();

  const [isOpenDialog, setDialog] = useState<boolean>(false);
  const closeDialog = useCallback(() => {
    setDialog(false);
  }, []);

  // Destructure common properties
  const { id, displayName, text, uid, timestamp, type } = message;

  // Then conditionally access type-specific properties
  let boardSize: number | undefined, gameBoardId: string | undefined, image: string | undefined;

  if (type === 'settings' || type === 'room') {
    // TypeScript knows these properties exist on settings and room messages
    const typedMessage = message as MessageType & { boardSize: number; gameBoardId: string };
    boardSize = typedMessage.boardSize;
    gameBoardId = typedMessage.gameBoardId;
  }

  if (type === 'media') {
    // TypeScript knows this property exists on media messages
    const typedMessage = message as MessageType & { image: string };
    image = typedMessage.image;
  }

  const isImportable = type === 'settings' && boardSize === currentGameBoardSize;

  // Memoize time formatting with 1-minute precision to reduce re-renders
  const ago = useMemo(() => {
    const date = (timestamp as Timestamp)?.toDate();
    if (!date) return '';

    // Round to the nearest minute to reduce unnecessary re-renders
    const roundedTime = new Date(
      Math.floor(date.getTime() / MILLISECONDS_IN_A_MINUTE) * MILLISECONDS_IN_A_MINUTE
    );
    let result = moment(roundedTime).fromNow();
    if (result === 'in a few seconds') result = 'a few seconds ago';
    return result;
  }, [timestamp]);

  // Memoize image processing with precise dependencies
  const imageSrc = useMemo((): string | false => {
    if (type !== 'media' || !image) return false;
    // The image is already a data URL string
    return image;
  }, [type, image]);

  // Memoize markdown content rendering with text hash for better performance
  const markdownContent = useMemo(() => {
    if (type === 'actions') return null;
    if (!text || text.trim() === '') return null;
    return <Markdown remarkPlugins={[remarkGfm, remarkGemoji]}>{text}</Markdown>;
  }, [text, type]);

  return (
    <li
      className={clsx('message', isOwnMessage && 'own-message', isTransparent && 'transparent')}
      data-testid={`message-${id}`}
    >
      <div className="message-header">
        <div className="sender">
          <TextAvatar uid={uid} displayName={displayName} size="small" />
          {displayName}
        </div>
        <div className="timestamp">
          {ago}
          {!!isOwnMessage && ['media', 'chat'].includes(type) && id && (
            <DeleteMessageButton room={room} id={id} />
          )}
        </div>
      </div>
      <Divider sx={{ mb: 1 }} />
      <div className="message-message">
        {type === 'actions' ? <ActionText text={text} /> : markdownContent}
        {!!imageSrc && <img src={imageSrc} alt="uploaded by user" />}
        {type === 'settings' && (
          <>
            <Divider sx={{ my: 0.5 }} />
            {isImportable ? (
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Link to={`?importBoard=${gameBoardId}`}>
                  <Trans i18nKey="importBoard" />
                </Link>

                <CopyToClipboard
                  text={`${window.location.href}?importBoard=${gameBoardId}`}
                  copiedText={t('copiedLink')}
                  icon={<Share />}
                />
              </Box>
            ) : (
              <Trans i18nKey="incompatibleBoard" />
            )}
          </>
        )}
        {type === 'room' && (
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">
              {t('room')}: <a href={window.location.href}>{room}</a>
            </Typography>

            <CopyToClipboard
              text={window.location.href}
              copiedText={t('copiedLink')}
              icon={<Share />}
            />
          </Box>
        )}
        {text.includes(t('finish')) && isOwnMessage && (
          <Box textAlign="center">
            <Divider sx={{ mt: 1 }} />
            <Button onClick={() => setDialog(true)}>
              <Typography>{t('playAgain')}</Typography>
            </Button>
            <GameOverDialog isOpen={isOpenDialog} close={closeDialog} />
          </Box>
        )}
      </div>
    </li>
  );
}

// Custom comparison function for memo to optimize re-renders
const arePropsEqual = (prevProps: MessageProps, nextProps: MessageProps): boolean => {
  // Fast path: Check if message object is the same reference
  if (prevProps.message === nextProps.message) {
    // Still need to check other props that might have changed
    return (
      prevProps.isOwnMessage === nextProps.isOwnMessage &&
      prevProps.isTransparent === nextProps.isTransparent &&
      prevProps.currentGameBoardSize === nextProps.currentGameBoardSize &&
      prevProps.room === nextProps.room
    );
  }

  // Check essential props that affect rendering (most likely to change first)
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (prevProps.isOwnMessage !== nextProps.isOwnMessage) return false;
  if (prevProps.message.type !== nextProps.message.type) return false;
  if (prevProps.message.text !== nextProps.message.text) return false;

  // Check less frequently changing props
  if (
    prevProps.message.uid !== nextProps.message.uid ||
    prevProps.message.displayName !== nextProps.message.displayName ||
    prevProps.isTransparent !== nextProps.isTransparent ||
    prevProps.currentGameBoardSize !== nextProps.currentGameBoardSize ||
    prevProps.room !== nextProps.room
  ) {
    return false;
  }

  // Compare timestamps with 1-minute tolerance to reduce unnecessary re-renders
  const prevTime = (prevProps.message.timestamp as Timestamp)?.toDate()?.getTime() || 0;
  const nextTime = (nextProps.message.timestamp as Timestamp)?.toDate()?.getTime() || 0;
  // Round to minutes for comparison
  const prevMinute = Math.floor(prevTime / MILLISECONDS_IN_A_MINUTE);
  const nextMinute = Math.floor(nextTime / MILLISECONDS_IN_A_MINUTE);
  if (prevMinute !== nextMinute) return false;

  // For media messages, check if image data changed
  if (prevProps.message.type === 'media' && nextProps.message.type === 'media') {
    const prevMessage = prevProps.message as MessageType & { image: string };
    const nextMessage = nextProps.message as MessageType & { image: string };
    if (prevMessage.image !== nextMessage.image) {
      return false;
    }
  }

  // For settings/room messages, check board-related properties
  if (
    (prevProps.message.type === 'settings' || prevProps.message.type === 'room') &&
    (nextProps.message.type === 'settings' || nextProps.message.type === 'room')
  ) {
    const prevMessage = prevProps.message as MessageType & {
      boardSize: number;
      gameBoardId: string;
    };
    const nextMessage = nextProps.message as MessageType & {
      boardSize: number;
      gameBoardId: string;
    };

    if (
      prevMessage.boardSize !== nextMessage.boardSize ||
      prevMessage.gameBoardId !== nextMessage.gameBoardId
    ) {
      return false;
    }
  }

  return true;
};

export default memo(Message, arePropsEqual);
