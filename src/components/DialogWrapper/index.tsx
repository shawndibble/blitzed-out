import { Dialog, DialogActions, DialogContent, DialogTitle, type DialogProps } from '@mui/material';
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
  maxWidth?: DialogProps['maxWidth'];
  fullWidth?: boolean;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  actions?: ReactNode;
}

export default function DialogWrapper({
  children,
  open,
  close = null,
  isMobile = null,
  title = null,
  isLoading = false,
  maxWidth = 'md',
  fullWidth = false,
  ariaLabelledby,
  ariaDescribedby,
  actions,
}: DialogWrapperProps): JSX.Element | null {
  const breakpointResult = useBreakpoint();
  const isMobileBreakpoint = isMobile !== null ? isMobile : breakpointResult;

  if (isLoading) {
    return null;
  }

  return (
    <Dialog
      fullScreen={isMobileBreakpoint}
      open={open}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      disableRestoreFocus
    >
      <DialogTitle>
        {title}
        {typeof close === 'function' && <CloseIcon close={close} />}
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      {actions && <DialogActions sx={{ p: 2, gap: 1 }}>{actions}</DialogActions>}
    </Dialog>
  );
}
