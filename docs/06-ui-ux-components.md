# UI/UX Components & Patterns

## Overview

Blitzed Out uses Material-UI v7 as its component foundation with a custom dark theme. The application follows responsive design principles and implements progressive enhancement for optimal user experience across all devices.

## Design System

### Theme Configuration
**File**: `/src/theme.ts` (implied from Material-UI usage)

#### Color Palette
```typescript
const theme = createTheme({
  palette: {
    mode: 'dark',  // Default dark mode
    primary: {
      main: '#1976d2',    // Primary blue
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',    // Accent red
      light: '#f50057',
      dark: '#c51162',
    },
    background: {
      default: '#121212',  // Dark background
      paper: '#1e1e1e',    // Card background
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.6)',
    },
    // Intensity colors
    intensity: {
      1: '#4caf50',  // Green - Mild
      2: '#2196f3',  // Blue - Warm
      3: '#ff9800',  // Orange - Moderate
      4: '#ff5722',  // Deep Orange - Spicy
      5: '#f44336',  // Red - Wild
    }
  }
});
```

#### Typography
```typescript
typography: {
  fontFamily: 'Roboto, Arial, sans-serif',
  h1: { fontSize: '2.5rem', fontWeight: 500 },
  h2: { fontSize: '2rem', fontWeight: 500 },
  h3: { fontSize: '1.75rem', fontWeight: 500 },
  h4: { fontSize: '1.5rem', fontWeight: 500 },
  h5: { fontSize: '1.25rem', fontWeight: 500 },
  h6: { fontSize: '1rem', fontWeight: 500 },
  body1: { fontSize: '1rem' },
  body2: { fontSize: '0.875rem' },
  button: { textTransform: 'none' },  // No uppercase
}
```

#### Spacing System
- Base unit: 8px
- Spacing scale: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16
- Usage: `theme.spacing(2)` = 16px

### Responsive Breakpoints
**Hook**: `/src/hooks/useBreakpoint.ts`

```typescript
const breakpoints = {
  xs: 0,     // Mobile
  sm: 600,   // Tablet
  md: 960,   // Small desktop
  lg: 1280,  // Desktop
  xl: 1920   // Large desktop
};
```

## Component Library

### Core Components

#### App Shell Components

##### AppSkeleton
**File**: `/src/components/AppSkeleton/index.tsx`
- Loading state for entire app
- Displays during initial load
- Material-UI Skeleton components
- Smooth transition to loaded state

##### FullApp
**File**: `/src/components/FullApp/index.tsx`
- Main application wrapper
- Lazy-loaded after auth check
- Contains all providers and routers
- Error boundary integration

#### Navigation Components

##### Navigation Bar
**File**: `/src/views/Navigation/index.tsx`

Features:
- Responsive app bar
- Menu drawer for mobile
- User presence indicator
- Room info display
- Settings access

##### Menu Drawer
**File**: `/src/views/Navigation/MenuDrawer/index.tsx`

```typescript
interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  user?: User;
}
```

Menu Items:
- Game Settings
- Custom Tiles
- Manage Boards
- Schedule
- About/Guide
- Logout

##### User Presence Overlay
**File**: `/src/views/Navigation/UserPresenceOverlay/index.tsx`
- Shows online users
- Real-time status updates
- Avatar display
- Last seen times

##### Players Online
**File**: `/src/views/Navigation/PlayersOnline/index.tsx`
- Count of active players
- Click to view list
- Real-time updates
- Room-specific

#### Form Components

##### YesNoSwitch
**File**: `/src/components/GameForm/YesNoSwitch/index.tsx`

```typescript
interface YesNoSwitchProps {
  trueCondition: boolean;
  onChange: (event: ChangeEvent, checked: boolean) => void;
  yesLabel: string;
  noLabel?: string;
  sx?: SxProps;
}
```

Usage: Binary choice selections

##### IncrementalSelect
**File**: `/src/components/GameForm/IncrementalSelect/index.tsx`
- Numeric value selection
- Plus/minus buttons
- Min/max constraints
- Step increments

##### MultiSelect
**File**: `/src/components/MultiSelect/index.tsx`

```typescript
interface MultiSelectProps {
  onChange: (event: SelectChangeEvent<string[]>) => void;
  values: string[];
  options: Option[];
  label: ReactNode;
}
```

Features:
- Multiple selection
- Chip display
- Search/filter
- Select all option

##### SettingsSelect
**File**: `/src/components/SettingsSelect/index.tsx`
- Dropdown for settings
- Consistent styling
- Value persistence
- Change handlers

#### Display Components

##### Accordion
**File**: `/src/components/Accordion/index.tsx`
- Expandable content sections
- Custom styled MUI Accordion
- Smooth animations
- Nested support

##### InvisibleAccordionGrid
**File**: `/src/components/InvisibleAccordionGrid/index.tsx`

```typescript
interface InvisibleAccordionGridProps {
  children: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  id?: string;
}
```

Usage: Grid layout with collapsible sections

##### GridItem
**File**: `/src/components/GridItem/index.tsx`

```typescript
interface GridItemProps {
  children: ReactNode;
  sm?: number;
  xs?: number;
  md?: number;
  lg?: number;
  xl?: number;
}
```

Responsive grid item wrapper

##### GridItemActionCard
**File**: `/src/components/GridItemActionCard/index.tsx`
- Card for action display
- Intensity color coding
- Click interactions
- Hover effects

#### Message Components

##### MessageList
**File**: `/src/components/MessageList/index.tsx`
- Chat message display
- Virtual scrolling for performance
- Message types (chat/action/system)
- Auto-scroll to bottom

##### Message
**File**: `/src/components/MessageList/Message/index.tsx`

```typescript
interface MessageProps {
  message: Message;
  isOwnMessage: boolean;
  isTransparent: boolean;
  currentGameBoardSize: number;
  room: string;
}
```

Features:
- User avatars
- Timestamps
- Action formatting
- Message actions

##### MessageInput
**File**: `/src/components/MessageInput/index.tsx`
- Text input for chat
- Send button
- Enter to send
- Character limit

##### PopupMessage
**File**: `/src/components/PopupMessage/index.tsx`
- Temporary notifications
- Auto-dismiss
- Multiple types
- Queue management

#### Game Components

##### GameBoard
**File**: `/src/views/Room/GameBoard/index.tsx`
- Board layout rendering
- Tile grid display
- Player positions
- Animation support

##### GameTile
**File**: `/src/views/Room/GameBoard/GameTile/index.tsx`

```typescript
interface GameTileProps {
  tile: Tile;
  position: number;
  isCurrentPosition: boolean;
  onClick?: () => void;
}
```

Features:
- Intensity-based colors
- Number display
- Player markers
- Special tile indicators

##### RollButton
**File**: `/src/views/Room/RollButton/index.tsx`
- Dice rolling interface
- Animation on roll
- Result display
- Sound effects

##### RollOptionsMenu
**File**: `/src/views/Room/RollOptionsMenu/index.tsx`
- Dice type selection
- Custom dice configuration
- Roll modifiers
- History display

##### TurnIndicator
**File**: `/src/components/TurnIndicator/index.tsx`
- Current player display
- Turn order visualization
- Timer display (if enabled)
- Skip turn option

#### Dialog Components

##### DialogWrapper
**File**: `/src/components/DialogWrapper/index.tsx`
- Consistent dialog styling
- Close button
- Title bar
- Action buttons

##### TransitionModal
**File**: `/src/components/TransitionModal/index.tsx`
- Animated modal dialogs
- Fade/slide transitions
- Backdrop blur
- ESC to close

##### GameSettingsDialog
**File**: `/src/components/GameSettingsDialog/index.tsx`
- Settings modal wrapper
- Tab navigation
- Save/cancel actions
- Validation feedback

##### CustomTilesDialog
**File**: `/src/components/CustomTilesDialog/index.tsx`
- Custom tile management
- Add/edit/delete tiles
- Import/export
- Search and filter

##### GameOverDialog
**File**: `/src/components/GameOverDialog/index.tsx`
- Game completion screen
- Statistics display
- Play again option
- Share results

#### Player Components

##### TextAvatar
**File**: `/src/components/TextAvatar/index.tsx`

```typescript
interface TextAvatarProps {
  displayName: string;
  uid: string;
  size?: 'small' | 'medium';
}
```

Features:
- Initial-based avatars
- Consistent colors per user
- Size variants
- Tooltip with full name

##### LocalPlayerIndicator
**File**: `/src/components/LocalPlayerIndicator/index.tsx`
- Shows current local player
- Turn order display
- Player switching UI
- Visual emphasis

##### PlayerManagement
**File**: `/src/components/PlayerManagement/index.tsx`
- Add/remove players
- Edit player details
- Reorder players
- Role assignment

#### Utility Components

##### CopyToClipboard
**File**: `/src/components/CopyToClipboard/index.tsx`

```typescript
interface CopyToClipboardProps {
  text: string;
  copiedText?: string;
  icon?: ReactNode;
  tooltip?: string;
}
```

Features:
- Click to copy
- Success feedback
- Tooltip support
- Custom icons

##### CountDownButtonModal
**File**: `/src/components/CountDownButtonModal/index.tsx`
- Countdown timer display
- Start/pause/reset
- Visual progress
- Sound alerts

##### ToastAlert
**File**: `/src/components/ToastAlert/index.tsx`

```typescript
interface ToastAlertProps {
  children: ReactNode;
  open: boolean;
  close: () => void;
  type?: 'error' | 'warning' | 'info' | 'success';
  hideCloseButton?: boolean;
  vertical?: 'top' | 'bottom';
  horizontal?: 'left' | 'center' | 'right';
  disableAutoHide?: boolean;
}
```

##### ButtonRow
**File**: `/src/components/ButtonRow/index.tsx`
- Consistent button layout
- Spacing management
- Responsive wrapping
- Alignment options

## UI Patterns

### Loading States

#### Skeleton Screens
```typescript
// Component skeleton while loading
<Skeleton variant="rectangular" width={210} height={118} />
<Skeleton variant="text" sx={{ fontSize: '1rem' }} />
<Skeleton variant="circular" width={40} height={40} />
```

#### Suspense Boundaries
```typescript
<Suspense fallback={<ComponentLoader />}>
  <LazyComponent />
</Suspense>
```

#### Progress Indicators
- Linear progress for determinate operations
- Circular progress for indeterminate
- Custom progress with percentages

### Error Handling

#### Error Boundaries
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <RiskyComponent />
</ErrorBoundary>
```

#### Error Messages
- Inline error text
- Alert components
- Toast notifications
- Modal error dialogs

### Form Patterns

#### Validation
- Real-time validation
- Error messages below fields
- Success indicators
- Submit button state management

#### Field Groups
- Logical grouping
- Collapsible sections
- Progressive disclosure
- Wizard patterns

### Navigation Patterns

#### Tab Navigation
- Horizontal tabs for sections
- Vertical tabs for settings
- Swipeable tabs on mobile
- Tab indicators

#### Breadcrumbs
- Path visualization
- Click to navigate
- Current page highlight
- Responsive truncation

### Animation Patterns

#### Transitions
**Library**: Framer Motion

```typescript
const variants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};
```

#### Micro-interactions
- Button hover effects
- Card lift on hover
- Smooth color transitions
- Loading animations

### Responsive Patterns

#### Mobile-First Design
```typescript
sx={{
  fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
  padding: { xs: 1, sm: 2, md: 3 },
  display: { xs: 'block', md: 'flex' }
}}
```

#### Adaptive Layouts
- Stack on mobile
- Side-by-side on desktop
- Collapsible sidebars
- Responsive grids

## Accessibility

### WCAG Compliance

#### Semantic HTML
- Proper heading hierarchy
- ARIA labels
- Role attributes
- Landmark regions

#### Keyboard Navigation
- Tab order management
- Focus indicators
- Skip links
- Keyboard shortcuts

#### Screen Reader Support
- Alt text for images
- ARIA live regions
- Descriptive labels
- Status announcements

### Color Accessibility
- Sufficient contrast ratios
- Color-blind safe palettes
- Multiple indicators (not just color)
- High contrast mode support

## Internationalization

### i18n Integration
**Setup**: `/src/locales/`

#### Translation Components
```typescript
import { Trans, useTranslation } from 'react-i18next';

// Hook usage
const { t } = useTranslation();
<Button>{t('button.submit')}</Button>

// Component usage
<Trans i18nKey="welcome.message">
  Welcome to <strong>Blitzed Out</strong>
</Trans>
```

#### Language Switching
**Component**: `/src/views/GameSettings/AppSettings/LanguageSelect/`
- Dropdown selector
- Flag icons
- Instant switching
- Persistence

#### RTL Support
- Direction detection
- Layout mirroring
- Text alignment
- Component flipping

## Performance Patterns

### Code Splitting
```typescript
// Route-based splitting
const GameSettings = lazy(() => import('./views/GameSettings'));

// Component-based splitting
const HeavyComponent = lazy(() => 
  import(/* webpackChunkName: "heavy" */ './HeavyComponent')
);
```

### Memoization
```typescript
// Component memoization
const MemoizedComponent = React.memo(Component);

// Value memoization
const expensiveValue = useMemo(() => 
  computeExpensive(deps), [deps]
);

// Callback memoization
const stableCallback = useCallback(() => 
  doSomething(deps), [deps]
);
```

### Virtual Scrolling
**Library**: `@tanstack/react-virtual`

```typescript
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

## Style Patterns

### CSS-in-JS with Emotion
```typescript
const StyledComponent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));
```

### sx Prop Pattern
```typescript
<Box
  sx={{
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    gap: 2,
    p: 3,
    bgcolor: 'background.paper',
    borderRadius: 1,
  }}
/>
```

### Theme Overrides
```typescript
const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
  },
});
```

## Component Best Practices

### Composition Over Inheritance
```typescript
// Prefer composition
function SpecialButton({ special, ...props }) {
  return (
    <Button {...props}>
      {special && <SpecialIcon />}
      {props.children}
    </Button>
  );
}
```

### Prop Spreading
```typescript
// Controlled prop spreading
function Component({ className, ...restProps }) {
  return (
    <div 
      className={clsx('base-class', className)}
      {...restProps}
    />
  );
}
```

### Default Props
```typescript
interface Props {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary';
}

const Component: FC<Props> = ({ 
  size = 'medium',
  color = 'primary',
  ...props 
}) => {
  // Component logic
};
```

## Future UI Enhancements

### Planned Components
- Advanced statistics dashboard
- Achievement badges
- Social features UI
- Tournament brackets
- Live streaming view

### Design System Evolution
- Component documentation
- Storybook integration
- Design tokens
- Figma design system
- Accessibility audit

### Performance Improvements
- React Server Components (when stable)
- Concurrent features optimization
- Bundle size reduction
- Image optimization
- Font optimization