import MuiClose from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';

export default function CloseIcon({ close }) {
  return (
    <IconButton
      aria-label='close'
      onClick={close}
      sx={{
        position: 'absolute',
        right: 8,
        top: 8,
      }}
    >
      <MuiClose />
    </IconButton>
  );
}
