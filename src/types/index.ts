import { User as FirebaseUser } from 'firebase/auth';
import { SelectChangeEvent } from '@mui/material/Select';
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material/styles';
import { GameMode, PlayerRole } from './Settings';
// Common types used throughout the application

// Auth related types
export interface User extends FirebaseUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

// Component prop types
export interface ButtonRowProps {
  children: React.ReactNode;
  justifyContent?: string;
}

export interface CopyToClipboardProps {
  text: string;
  copiedText?: string | null;
  icon?: React.ReactNode;
  tooltip?: string | null;
}

export interface YesNoSwitchProps {
  trueCondition: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  yesLabel: string;
  noLabel?: string | null;
  sx?: SxProps<Theme>;
}

export interface GridItemProps {
  children: React.ReactNode;
  sm?: number;
  [key: string]: any;
}

export interface InvisibleAccordionGridProps {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  defaultExpanded?: boolean;
  [key: string]: any;
}

export interface MessageProps {
  message: any; // Replace with specific message type when you have the structure
  isOwnMessage: boolean;
  isTransparent: boolean;
  currentGameBoardSize: number;
  room: string;
}

export interface MultiSelectProps {
  onChange: (event: SelectChangeEvent<string[]>) => void;
  values: string[];
  options: Option[];
  label: React.ReactNode;
}

export interface Option {
  value: string;
  label: React.ReactNode;
}

export interface TextAvatarProps {
  displayName: string;
  uid: string;
  size?: 'small' | 'medium';
}

export interface ToastAlertProps {
  children: React.ReactNode;
  open: boolean;
  close: () => void;
  type?: 'error' | 'warning' | 'info' | 'success';
  hideCloseButton?: boolean;
  vertical?: 'top' | 'bottom';
  horizontal?: 'left' | 'center' | 'right';
  disableAutoHide?: boolean;
}

// Hook return types
export interface CountdownHookReturn {
  timeLeft: number;
  isPaused: boolean;
  togglePause: () => void;
  resetTimer: (newTime?: number) => void;
}

export interface FullscreenHookReturn {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

export interface LocalStorageHookReturn<T> {
  storage: T;
  setStorage: (value: T | ((val: T) => T)) => void;
  removeStorage: () => void;
}

// Form data types
export interface FormData {
  [key: string]: any;
  gameMode: GameMode;
  isNaked?: boolean;
  isAppend?: boolean;
  room: string;
  roomRealtime?: boolean;
  actions?: any[];
  consumption?: any[];
  role?: PlayerRole;
  boardUpdated: boolean;
  finishRange?: [number, number];
}

export interface ActionEntry {
  type: string;
  level: number;
  variation?: string;
  [key: string]: any;
}

// Game board types
export interface Tile {
  id?: number;
  title: string;
  description: string;
  index?: number;
  [key: string]: any;
}

export interface BoardType {
  id: number;
  title: string;
  tiles?: Tile[];
  isActive: number;
  tags?: string[];
  gameMode?: string;
  [key: string]: any;
}

// Alert state type
export interface AlertState {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

// Roll value state
export interface RollValueState {
  value: number;
  time: number;
}

// Re-export custom group types
export type {
  CustomGroup,
  CustomGroupBase,
  CustomGroupPush,
  CustomGroupPull,
  CustomGroupIntensity,
  CustomGroupDialogProps,
  CustomGroupSelectorProps,
  IntensitySelectorProps,
  CustomGroupFilters,
  ValidationResult,
  IntensityTemplate,
  CustomGroupExportData,
} from './customGroups';
export { DEFAULT_INTENSITY_TEMPLATES } from './customGroups';
