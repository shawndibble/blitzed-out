import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
} from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import useBreakpoint from '@/hooks/useBreakpoint';

export interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title: ReactNode;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText,
  cancelText,
  severity = 'info',
  confirmColor = 'primary',
}: ConfirmationModalProps): JSX.Element {
  const { t } = useTranslation();
  const isMobile = useBreakpoint();

  const handleCancel = (): void => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleConfirm = (): void => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>
        {severity !== 'info' && (
          <Alert severity={severity} sx={{ mb: 2 }}>
            {severity === 'warning' && t('warning')}
            {severity === 'error' && t('error')}
            {severity === 'success' && t('success')}
          </Alert>
        )}
        <DialogContentText id="confirmation-dialog-description">{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleCancel} variant="outlined" color="inherit" fullWidth={isMobile}>
          {cancelText || t('cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={confirmColor}
          fullWidth={isMobile}
          autoFocus
        >
          {confirmText || t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
