/**
 * Common component types and interfaces
 */
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Base props for all components
 */
export interface BaseComponentProps {
  className?: string;
  sx?: SxProps<Theme>;
  'data-testid'?: string;
}

/**
 * Base props for selector components
 */
export interface SelectorProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Props for CustomGroupSelector component
 */
export interface CustomGroupSelectorProps extends SelectorProps {
  locale: string;
  gameMode: string;
  includeDefault?: boolean;
}

/**
 * Props for form input components
 */
export interface FormInputProps extends BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  fullWidth?: boolean;
}

/**
 * Props for dialog components
 */
export interface DialogProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

/**
 * Props for tab components
 */
export interface TabProps extends BaseComponentProps {
  label: string;
  value: string | number;
  disabled?: boolean;
}
