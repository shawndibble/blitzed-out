import { User as FirebaseUser } from 'firebase/auth';
import { SelectChangeEvent as MuiSelectChangeEvent } from '@mui/material/Select';
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
  onChange: (value: boolean) => void;
  yesLabel: string;
  noLabel?: string | null;
  sx?: Record<string, unknown>;
}

export interface GridItemProps {
  children: React.ReactNode;
}

export interface InvisibleAccordionGridProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
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
  onChange: (values: string[]) => void;
  values: string[];
  options: { value: string; label: string }[];
  label: string;
}

export interface TextAvatarProps {
  name: string;
  uid: string;
  size?: 'small' | 'medium' | 'large';
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
  gameMode?: string;
  isNaked?: boolean;
  isAppend?: boolean;
  room?: string;
  roomRealtime?: boolean;
  actions?: any[];
  consumption?: any[];
  role?: string;
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
  title?: string;
  description?: string;
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
  type: 'success' | 'error' | 'info' | 'warning';
}

// Settings interface
export interface Settings {
  boardUpdated: boolean;
  roomUpdated?: boolean;
  playerDialog?: boolean;
  othersDialog?: boolean;
  mySound?: boolean;
  otherSound?: boolean;
  chatSound?: boolean;
  readRoll?: boolean;
  hideBoardActions?: boolean;
  locale?: string;
  gameMode?: string;
  background?: string;
  finishRange?: number[];
  roomTileCount?: number;
  roomDice?: string;
  room?: string;
  [key: string]: any;
}

// Roll value state
export interface RollValueState {
  value: number;
  time: number;
}
