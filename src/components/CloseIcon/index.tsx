import MuiClose from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';

interface CloseIconProps {
  close: () => void;
}

export default function CloseIcon({ close }: CloseIconProps): JSX.Element {
  return (
    <IconButton
      aria-label="close"
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
