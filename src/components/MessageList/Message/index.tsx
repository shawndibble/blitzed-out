import { Box, Button, Divider, Typography } from '@mui/material';
import clsx from 'clsx';
import DeleteMessageButton from '@/components/DeleteMessageButton';
import GameOverDialog from '@/components/GameOverDialog';
import TextAvatar from '@/components/TextAvatar';
import moment from 'moment';
import { useCallback, useState } from 'react';
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

interface MessageProps {
  message: MessageType;
  isOwnMessage: boolean;
  isTransparent?: boolean;
  currentGameBoardSize?: number;
  room: string;
}

interface ImageData {
  format: string;
  base64String: string;
}

export default function Message({
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
  let boardSize, gameBoardId, image;

  if (type === 'settings' || type === 'room') {
    // TypeScript knows these properties exist on settings and room messages
    boardSize = (message as any).boardSize;
    gameBoardId = (message as any).gameBoardId;
  }

  if (type === 'media') {
    // TypeScript knows this property exists on media messages
    image = (message as any).image;
  }

  const isImportable = type === 'settings' && boardSize === currentGameBoardSize;

  let ago = moment((timestamp as Timestamp)?.toDate()).fromNow();
  if (ago === 'in a few seconds') ago = 'a few seconds ago';

  let imageSrc: string | false = false;
  if (type === 'media' && image) {
    const imageData = image as unknown as ImageData;
    imageSrc = `data:image/${imageData.format};base64,${imageData.base64String}`;
  }

  return (
    <li className={clsx('message', isOwnMessage && 'own-message', isTransparent && 'transparent')}>
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
        {type === 'actions' ? (
          <ActionText text={text} />
        ) : (
          <Markdown remarkPlugins={[remarkGfm, remarkGemoji]}>{text}</Markdown>
        )}
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
