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
        color="error"
        size="small"
        sx={{ p: 0, ml: 1 }}
      >
        <Delete fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}
