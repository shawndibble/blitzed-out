export interface CustomTilesDialogProps {
  open: boolean;
  close?: ((open: boolean) => void) | null;
}
