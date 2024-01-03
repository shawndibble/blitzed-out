import { Delete } from '@mui/icons-material';
import { Divider, IconButton, Tooltip } from '@mui/material';
import clsx from 'clsx';
import TextAvatar from 'components/TextAvatar';
import moment from 'moment';
import { Trans } from 'react-i18next';
import Markdown from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { deleteMessage } from 'services/firebase';

function DeleteMessageButton({ room, id }) {
  return (
    <Tooltip title={<Trans i18nKey="delete" />}>
      <IconButton onClick={() => deleteMessage(room, id)} aria-label="delete" color="error" size="small" sx={{ p: 0, ml: 1 }}>
        <Delete fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}

export default function Message({
  message, isOwnMessage, isTransparent, currentGameBoardSize, room,
}) {
  const {
    id, displayName, text, uid, timestamp, type, gameBoard, image,
  } = message;

  const isImportable = type === 'settings' && gameBoard && JSON.parse(gameBoard).length === currentGameBoardSize;

  let ago = moment(timestamp?.toDate()).fromNow();
  if (ago === 'in a few seconds') ago = 'a few seconds ago';

  let imageSrc = false;
  if (type === 'media') {
    imageSrc = `data:image/${image.format};base64,${image.base64String}`;
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
          {!!isOwnMessage && ['media', 'chat'].includes(type) && (
            <DeleteMessageButton room={room} id={id} />
          )}
        </div>

      </div>
      <Divider />
      <div className="message-message">
        <Markdown remarkPlugins={[remarkGfm]}>
          {text}
        </Markdown>
        {!!imageSrc && (
          <img src={imageSrc} alt="uploaded by user" />
        )}
        {type === 'settings' && (
          <>
            <Divider sx={{ my: 0.5 }} />
            {isImportable ? (
              <Link to={`?importBoard=${id}`}><Trans i18nKey="importBoard" /></Link>
            ) : (
              <Trans i18nKey="incompatibleBoard" />
            )}
          </>
        )}
      </div>
    </li>
  );
}
