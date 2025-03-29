import CloseIcon from '@mui/icons-material/Close';
import { Alert, Portal, Slide } from '@mui/material';
import { useTranslation } from 'react-i18next';
import IconButton from '@mui/material/IconButton';
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';
import { ReactNode, SyntheticEvent } from 'react';

type AlertType = 'error' | 'warning' | 'info' | 'success';

interface ToastAlertProps {
  children: ReactNode;
  open: boolean;
  close: () => void;
  type?: AlertType;
  hideCloseButton?: boolean;
  vertical?: SnackbarOrigin['vertical'];
  horizontal?: SnackbarOrigin['horizontal'];
  disableAutoHide?: boolean;
}

export default function ToastAlert({
  children,
  open,
  close,
  type = 'error',
  hideCloseButton = false,
  vertical = 'bottom',
  horizontal = 'center',
  disableAutoHide = false,
}: ToastAlertProps): JSX.Element {
  const { t } = useTranslation();

  const handleClose = (_event: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    close();
  };

  const action = !hideCloseButton && (
    <IconButton size="small" aria-label={t('close')} color="inherit" onClick={handleClose}>
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
          onClose={!hideCloseButton ? handleClose : undefined}
          severity={type}
          sx={{ width: '100%' }}
        >
          {children}
        </Alert>
      </Snackbar>
    </Portal>
  );
}
