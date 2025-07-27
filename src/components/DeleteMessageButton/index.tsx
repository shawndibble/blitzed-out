import { Delete } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { Trans } from 'react-i18next';
import { deleteMessage } from '@/services/firebase';

interface DeleteMessageButtonProps {
  room: string;
  id: string;
}

export default function DeleteMessageButton({ room, id }: DeleteMessageButtonProps): JSX.Element {
  return (
    <Tooltip title={<Trans i18nKey="delete" />}>
      <IconButton
        onClick={() => deleteMessage(room, id)}
        aria-label="delete"
        size="small"
        sx={{
          p: 0.5,
          ml: 1,
          opacity: 0.6,
          transition: 'all 0.2s ease',
          '&:hover': {
            opacity: 1,
            color: 'error.main',
            backgroundColor: 'rgba(255, 82, 82, 0.1)',
            transform: 'scale(1.1)',
          },
        }}
      >
        <Delete fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
