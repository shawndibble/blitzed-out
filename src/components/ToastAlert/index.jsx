import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Portal, Slide } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function ToastAlert({
  children,
  open,
  close,
  type = 'error',
  hideCloseButton = false,
  vertical = 'bottom',
  horizontal = 'center',
  disableAutoHide = false,
}) {
  const { t } = useTranslation();
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    close();
  };

  const action = !hideCloseButton && (
    <IconButton
      size="small"
      aria-label={t('close')}
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
        autoHideDuration={disableAutoHide ? 60000 : 4000}
        onClose={handleClose}
        action={action}
        anchorOrigin={{ vertical, horizontal }}
        TransitionComponent={Slide}
      >
        <Alert
          onClose={!hideCloseButton && handleClose}
          severity={type}
          sx={{ width: '100%' }}
        >
          {children}
        </Alert>
      </Snackbar>
    </Portal>
  );
}
