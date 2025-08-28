import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DeleteDialogProps } from './types';

export default function DeleteDialog({
  open,
  pendingDeleteGroup,
  onClose,
  onConfirm,
}: DeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('customGroups.confirmDelete')}</DialogTitle>
      <DialogContent>
        <Typography>
          {(pendingDeleteGroup?.tileCount ?? 0) > 0
            ? t('customGroups.deleteGroupWithTiles', {
                name: pendingDeleteGroup?.name,
                count: pendingDeleteGroup?.tileCount,
              })
            : t('customGroups.deleteGroupConfirm', { name: pendingDeleteGroup?.name })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {t('delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
