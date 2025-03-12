import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import CloseIcon from '@/components/CloseIcon';
import useBreakpoint from '@/hooks/useBreakpoint';
import React from 'react';

export default function DialogWrapper({
  children,
  open,
  close = null,
  isMobile = null,
  title = null,
  isLoading = false,
}) {
  const isMobileBreakpoint = isMobile || useBreakpoint();

  if (isLoading) {
    return null;
  }

  return (
    <Dialog fullScreen={isMobileBreakpoint} open={open} maxWidth="md">
      <DialogTitle>
        {title}
        {typeof close === 'function' && <CloseIcon close={close} />}
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}
