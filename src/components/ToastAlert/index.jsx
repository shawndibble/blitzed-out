import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Portal } from '@mui/material';

export default function ToastAlert({
  children, open, close, type = 'error',
}) {
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    close();
  };

  const action = (
    <IconButton
      size="small"
      aria-label="close"
      color="inherit"
      onClick={handleClose}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  return (
    <Portal>
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        action={action}
      >
        <Alert onClose={handleClose} severity={type} sx={{ width: '100%' }}>
          {children}
        </Alert>
      </Snackbar>
    </Portal>
  );
}
