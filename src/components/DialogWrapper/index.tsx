import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import CloseIcon from '@/components/CloseIcon';
import useBreakpoint from '@/hooks/useBreakpoint';
import { ReactNode } from 'react';

interface DialogWrapperProps {
  children: ReactNode;
  open: boolean;
  close?: (() => void) | null;
  isMobile?: boolean | null;
  title?: ReactNode | null;
  isLoading?: boolean;
}

export default function DialogWrapper({
  children,
  open,
  close = null,
  isMobile = null,
  title = null,
  isLoading = false,
}: DialogWrapperProps): JSX.Element | null {
  const breakpointResult = useBreakpoint();
  const isMobileBreakpoint = isMobile !== null ? isMobile : breakpointResult;

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
