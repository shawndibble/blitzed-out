import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Portal, Slide } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function ToastAlert({
  children, open, close, type = 'error',
}) {
  const { t } = useTranslation();
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    close();
  };

  const action = (
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
        autoHideDuration={4000}
        onClose={handleClose}
        action={action}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert onClose={handleClose} severity={type} sx={{ width: '100%' }}>
          {children}
        </Alert>
      </Snackbar>
    </Portal>
  );
}
