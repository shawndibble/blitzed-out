import { Box, Button, Typography, Chip, IconButton, Popover } from '@mui/material';
import { Settings, Home, InfoOutlined } from '@mui/icons-material';
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
  const [detailsAnchor, setDetailsAnchor] = useState<HTMLElement | null>(null);

  const closeDialog = useCallback(() => {
    setDialog(false);
  }, []);

  const handleDetailsClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setDetailsAnchor(event.currentTarget);
  }, []);

  const handleDetailsClose = useCallback(() => {
    setDetailsAnchor(null);
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

  // Generate smart summary for system messages
  const systemSummary = useMemo(() => {
    if (type !== 'settings' && type !== 'room') return null;

    if (type === 'settings') {
      const settingsCount = (text.match(/\*/g) || []).length;
      if (settingsCount > 1) {
        return t('updatedMultipleSettings', { count: settingsCount });
      }
      return t('updatedGameSettings');
    }

    if (type === 'room') {
      return t('updatedRoomSettings');
    }

    return null;
  }, [type, text, t]);

  // Check if this is a system message that should use compact layout
  const isSystemMessage = type === 'settings' || type === 'room';

  // Check if text is likely to wrap (long text or contains multiple words)
  const isLikelyToWrap = useMemo(() => {
    if (!isSystemMessage || !systemSummary) return false;
    const fullText = `${displayName} ${systemSummary}`;
    return fullText.length > 45 || fullText.split(' ').length > 6;
  }, [isSystemMessage, systemSummary, displayName]);

  // Render system message (settings/room) with compact layout
  if (isSystemMessage) {
    return (
      <li
        className={clsx(
          'message',
          'system-message',
          isTransparent && 'transparent',
          isLikelyToWrap && 'full-width'
        )}
        data-testid={`message-${id}`}
      >
        <div className="system-message-content">
          <div className="system-icon">
            {type === 'settings' ? <Settings fontSize="small" /> : <Home fontSize="small" />}
          </div>
          <div className={clsx('system-text', isLikelyToWrap && 'wrapping')}>
            <Typography variant="body2" component="span">
              <strong>{displayName}</strong> {systemSummary}
            </Typography>
            <Typography variant="caption" className="system-timestamp">
              {ago}
            </Typography>
          </div>
          <IconButton
            size="small"
            onClick={handleDetailsClick}
            aria-label="View details"
            data-testid={`details-button-${id}`}
          >
            <InfoOutlined fontSize="small" />
          </IconButton>
        </div>

        {/* Details Popover */}
        <Popover
          open={Boolean(detailsAnchor)}
          anchorEl={detailsAnchor}
          onClose={handleDetailsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          data-testid={`details-popover-${id}`}
        >
          <Box className="system-details-popover">
            <div className="system-details-content">{markdownContent}</div>

            {type === 'settings' && (
              <Box className="system-action-buttons">
                {isImportable ? (
                  <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                    <Button
                      component={Link}
                      to={`?importBoard=${gameBoardId}`}
                      variant="contained"
                      size="small"
                      color="primary"
                    >
                      <Trans i18nKey="importBoard" />
                    </Button>
                    <CopyToClipboard
                      text={`${window.location.href}?importBoard=${gameBoardId}`}
                      copiedText={t('copiedLink')}
                      icon={<Share />}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    <Trans i18nKey="incompatibleBoard" />
                  </Typography>
                )}
              </Box>
            )}

            {type === 'room' && (
              <Box className="system-action-buttons">
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                  <Typography variant="body2">
                    {t('room')}: <strong>{room}</strong>
                  </Typography>
                  <CopyToClipboard
                    text={window.location.href}
                    copiedText={t('copiedLink')}
                    icon={<Share />}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Popover>
      </li>
    );
  }

  // Render regular message (chat, actions, media) with standard layout
  return (
    <li
      className={clsx('message', isOwnMessage && 'own-message', isTransparent && 'transparent')}
      data-testid={`message-${id}`}
    >
      <div className="message-header">
        <div className="sender">
          <TextAvatar uid={uid} displayName={displayName} size="small" />
          <span className="sender-name">{displayName}</span>
          <Chip label={ago} size="small" variant="outlined" className="timestamp-chip" />
        </div>
        <div className="message-actions">
          {!!isOwnMessage && ['media', 'chat'].includes(type) && id && (
            <DeleteMessageButton room={room} id={id} />
          )}
        </div>
      </div>
      <div className="message-message">
        {type === 'actions' ? <ActionText text={text} /> : markdownContent}
        {!!imageSrc && <img src={imageSrc} alt="uploaded by user" />}
        {text.includes(t('finish')) && isOwnMessage && (
          <Box textAlign="center" className="message-action-box">
            <Button onClick={() => setDialog(true)} variant="outlined" size="small">
              <Typography>{t('playAgain')}</Typography>
            </Button>
            <GameOverDialog isOpen={isOpenDialog} close={closeDialog} />
          </Box>
        )}
      </div>
    </li>
  );
}
