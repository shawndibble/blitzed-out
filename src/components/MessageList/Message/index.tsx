import { Box, Button, Divider, Typography } from '@mui/material';
import clsx from 'clsx';
import DeleteMessageButton from '@/components/DeleteMessageButton';
import GameOverDialog from '@/components/GameOverDialog';
import TextAvatar from '@/components/TextAvatar';
import { useCallback, useState, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import Markdown from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import remarkGemoji from 'remark-gemoji';
import CopyToClipboard from '@/components/CopyToClipboard';
import { Share } from '@mui/icons-material';
import ActionText from './actionText';
import { Message as MessageType } from '@/types/Message';
import { parseMessageTimestamp } from '@/helpers/timestamp';
import { getDayjsWithLocale } from '@/helpers/momentLocale';

const MILLISECONDS_IN_A_MINUTE = 60000;

interface MessageProps {
  message: MessageType;
  isOwnMessage: boolean;
  isTransparent?: boolean;
  currentGameBoardSize?: number;
  room: string;
}

export default function Message({
  message,
  isOwnMessage,
  isTransparent,
  currentGameBoardSize = 40,
  room,
}: MessageProps): JSX.Element {
  const { t, i18n } = useTranslation();

  const [isOpenDialog, setDialog] = useState<boolean>(false);
  const closeDialog = useCallback(() => {
    setDialog(false);
  }, []);

  // Destructure common properties
  const { id, displayName, text, uid, timestamp, type } = message;

  // Then conditionally access type-specific properties
  let boardSize: number | undefined;
  let gameBoardId: string | undefined;
  let image: string | undefined;

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
    const date = parseMessageTimestamp(timestamp);
    if (!date) return '';

    // Round to the nearest minute to reduce unnecessary re-renders
    const roundedTime = new Date(
      Math.floor(date.getTime() / MILLISECONDS_IN_A_MINUTE) * MILLISECONDS_IN_A_MINUTE
    );

    // Get dayjs instance with proper locale
    const currentLanguage = i18n.resolvedLanguage || i18n.language;
    const dayjsInstance = getDayjsWithLocale(roundedTime, currentLanguage);
    let result = dayjsInstance.fromNow();

    // Handle "in a few seconds" case by showing "a minute ago" instead
    // This check works across languages since we're looking for seconds-based results
    if (Math.abs(dayjsInstance.diff(dayjs(), 'seconds')) < 30) {
      result = dayjsInstance.subtract(1, 'minute').fromNow();
    }
    return result;
  }, [timestamp, i18n.language, i18n.resolvedLanguage]);

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
