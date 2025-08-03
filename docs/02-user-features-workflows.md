# User Features & Workflows

## Overview

This document details all user-facing features and their workflows in the Blitzed Out application. Each feature includes user stories, interaction flows, and technical implementation references.

## Table of Contents
1. [Setup Wizard](#setup-wizard)
2. [Game Settings Management](#game-settings-management)
3. [Local Players Functionality](#local-players-functionality)
4. [Solo Mode](#solo-mode)
5. [Online Multiplayer](#online-multiplayer)
6. [Room Management](#room-management)
7. [Custom Content Creation](#custom-content-creation)
8. [Cast Mode](#cast-mode)
9. [About & Help Section](#about--help-section)
10. [Progressive Web App Features](#progressive-web-app-features)

---

## Setup Wizard

### Overview
A guided, step-by-step onboarding process that helps users configure their game experience.

### Location
- **Main Component**: `/src/views/GameSettingsWizard/index.tsx`
- **Steps**: `/src/views/GameSettingsWizard/*/`

### Workflow Steps

#### Step 1: Room Selection (`RoomStep`)
**File**: `/src/views/GameSettingsWizard/RoomStep/index.tsx`
- Choose between PUBLIC room or create private room
- Enter custom room code (4-8 uppercase letters)
- Validation for room format
- Real-time availability checking

#### Step 2: Local Players Setup (`LocalPlayersStep`)
**File**: `/src/views/GameSettingsWizard/LocalPlayersStep/index.tsx`
- **Conditional**: Only shows for non-public rooms
- Add 2-8 local players
- Set player names
- Assign roles (sub/dom/vers)
- Configure turn order
- Optional: Assign notification sounds

#### Step 3: Game Mode Selection (`GameModeStep`)
**File**: `/src/views/GameSettingsWizard/GameModeStep/index.tsx`
- Select from three modes:
  - **Solo**: Single player
  - **Online**: Multiplayer via internet
  - **Local**: Multiple players on one device

#### Step 4: Actions Configuration (`ActionsStep`)
**File**: `/src/views/GameSettingsWizard/ActionsStep/index.tsx`
- Select action categories
- Configure intensity levels (1-5)
- Pick specific actions or use presets
- Optional consumption items

#### Step 5: Finish Settings (`FinishStep`)
**File**: `/src/views/GameSettingsWizard/FinishStep/index.tsx`
- Set board size (finish range)
- Review all settings
- Option to save as preset
- Launch game or go to advanced settings

### Dynamic Step Flow
```javascript
// Conditional step logic
if (isPublicRoom) {
  skip LocalPlayersStep
}
if (gameMode === 'solo') {
  hide multiplayer options
}
```

### User Benefits
- 🎯 Guided setup reduces confusion
- ⚡ Smart defaults speed up configuration
- 🔄 Can return to any step
- 💾 Settings persist across sessions

---

## Game Settings Management

### Overview
Comprehensive settings panel for fine-tuning all aspects of the game experience.

### Location
- **Main View**: `/src/views/GameSettings/index.tsx`
- **Sub-sections**: `/src/views/GameSettings/*/`

### Settings Categories

#### 1. App Settings
**File**: `/src/views/GameSettings/AppSettings/index.tsx`

##### Display Settings
- **Language Selection**: `/src/views/GameSettings/AppSettings/LanguageSelect/`
  - Supported: English, Spanish, French, Hindi, Chinese
  - Auto-detection from browser
  - Persistent selection

- **Theme Mode**: Light/Dark/System
  - System follows OS preference
  - Instant theme switching
  - Saves preference

- **Background Customization**
  - Default backgrounds
  - Custom image upload
  - Room-specific backgrounds

##### Audio Settings
- My turn sounds (on/off)
- Other player sounds (on/off)
- Chat notification sounds
- Voice preferences for text-to-speech

##### Privacy Settings
- Hide board actions from others
- Anonymous mode toggle
- Data sync preferences

#### 2. Board Settings
**File**: `/src/views/GameSettings/BoardSettings/index.tsx`

##### Board Configuration
- **Board Selection**: `/src/views/GameSettings/BoardSettings/SelectBoardSetting/`
  - Choose from saved boards
  - Create new board
  - Import board configuration

- **Finish Range**: `/src/views/GameSettings/BoardSettings/FinishSlider/`
  - Adjustable game length (10-100 tiles)
  - Visual slider with preview
  - Affects game duration

- **Solo Mode Toggle**: `/src/views/GameSettings/BoardSettings/SoloSwitch/`
  - Enable/disable solo play
  - Adjusts available features

#### 3. Room Settings
**File**: `/src/views/GameSettings/RoomSettings/index.tsx`

##### Room Configuration
- **Room Code**: Display and edit
- **Room Privacy**: Public/Private toggle
- **Real-time Mode**: Enable/disable live updates
- **Player List Display**: `/src/views/GameSettings/RoomSettings/PlayerListOption/`
- **Game Speed**: `/src/views/GameSettings/RoomSettings/GameSpeed/`

#### 4. Local Player Settings
**File**: `/src/views/GameSettings/LocalPlayerSettings.tsx`

##### Player Management
- Add/remove players (2-8)
- Edit player details
- Reorder turn sequence
- Configure notifications
- Player statistics view

### Settings Persistence
- **Local Storage**: Immediate persistence
- **Dexie Database**: Structured storage
- **Firebase Sync**: For registered users
- **Migration System**: Handles version updates

---

## Local Players Functionality

### Overview
Single-device multiplayer system allowing multiple players to share one device.

### Key Components
- **Hook**: `/src/hooks/useLocalPlayers.ts`
- **Store**: `/src/stores/localPlayerStore.ts`
- **Service**: `/src/services/localPlayerService.ts`
- **Types**: `/src/types/localPlayers.ts`

### Features

#### Player Management
```typescript
interface LocalPlayer {
  id: string;
  name: string;
  role: PlayerRole; // 'sub' | 'dom' | 'vers'
  order: number;
  isActive: boolean;
  location: number;
  isFinished: boolean;
  sound?: string;
}
```

#### Turn Management System
- **Automatic Turn Switching**: After each action
- **Manual Override**: Skip or change turns
- **Turn Indicators**: Visual and audio cues
- **Turn History**: Track who played when

#### Visual Indicators
- **Component**: `/src/components/LocalPlayerIndicator/`
- Current player highlight
- Turn order display
- Player avatars
- Progress tracking

#### Turn Transitions
- **Component**: `/src/components/Transitions/`
- Animated player change
- Name announcement
- Optional sound effects
- Customizable duration

#### Session Management
```typescript
interface LocalPlayerSession {
  id: string;
  roomId: string;
  players: LocalPlayer[];
  currentPlayerIndex: number;
  isActive: boolean;
  settings: LocalSessionSettings;
}
```

### Workflow
1. **Setup Phase**
   - Add players in wizard or settings
   - Configure names and roles
   - Set turn order
   - Assign sounds (optional)

2. **Game Phase**
   - Display current player
   - Show turn indicator
   - Play transition effects
   - Track player progress

3. **Completion Phase**
   - Mark players as finished
   - Continue with remaining players
   - Show final statistics

---

## Solo Mode

### Overview
Single-player experience optimized for personal exploration.

### Location
- **Toggle**: `/src/views/GameSettings/BoardSettings/SoloSwitch/`
- **Logic**: Handled via `gameMode: 'solo'` in settings

### Features

#### Simplified Interface
- No player management UI
- No turn indicators
- Streamlined controls
- Focus on content

#### Privacy Features
- No network requests
- Local storage only
- No presence tracking
- Anonymous by default

#### Customization
- Full access to tile creation
- Intensity controls
- Board customization
- Import/export configs

### Workflow
1. Select solo mode in wizard or settings
2. Configure preferences
3. Start game
4. Progress at own pace
5. Save progress locally

---

## Online Multiplayer

### Overview
Real-time multiplayer experience with presence tracking and messaging.

### Key Components
- **Room View**: `/src/views/Room/index.tsx`
- **Firebase Service**: `/src/services/firebase.ts`
- **Presence Hook**: `/src/hooks/usePresence.ts`

### Features

#### Room System
- **Public Rooms**: Open to all users
- **Private Rooms**: Password-protected
- **Room Codes**: 4-8 character identifiers
- **Auto-cleanup**: Expire after 30 days

#### Real-time Features
- **User Presence**: `/src/views/Navigation/UserPresenceOverlay/`
  - Online indicators
  - Last seen timestamps
  - Active player count

- **Message System**: `/src/components/MessageList/`
  - Real-time chat
  - Action announcements
  - System messages
  - 24-hour retention

#### Synchronization
- Board state sync
- Player positions
- Turn management
- Settings sync

### Workflow
1. **Join/Create Room**
   - Enter room code
   - Set display name
   - Configure role

2. **Active Play**
   - See other players
   - Send messages
   - Take turns
   - View board updates

3. **Presence Management**
   - Auto-disconnect handling
   - Reconnection support
   - Cleanup on exit

---

## Room Management

### Overview
Comprehensive room creation and management system.

### Components
- **Room Navigation**: `/src/views/Navigation/`
- **Room Monitor**: `/src/hooks/usePrivateRoomMonitor.ts`
- **Room Background**: `/src/components/RoomBackground/`

### Features

#### Room Creation
- Generate unique codes
- Set privacy level
- Configure permissions
- Custom backgrounds

#### Room Discovery
- Browse public rooms
- Search by code
- View active players
- Preview settings

#### Room Administration
- Kick players (host only)
- Update settings
- Lock/unlock room
- Delete room

#### Scheduled Games
- **Component**: `/src/views/Schedule/`
- Plan future games
- Calendar integration
- Reminders
- RSVP system

---

## Custom Content Creation

### Overview
Comprehensive system for creating and managing custom game content.

### Components

#### Custom Tiles Dialog
**Location**: `/src/views/CustomTileDialog/`

##### Add Custom Tile
**File**: `/src/views/CustomTileDialog/AddCustomTile/`
- Text input for action
- Category selection
- Intensity setting
- Role assignment
- Preview before save

##### View/Edit Tiles
**File**: `/src/views/CustomTileDialog/ViewCustomTiles/`
- List all custom tiles
- Filter and search
- Edit existing tiles
- Delete tiles
- Enable/disable tiles

##### Import/Export
**File**: `/src/views/CustomTileDialog/ImportExport/`
- Export to JSON
- Import from file
- Share via URL
- Validate imports
- Merge strategies

#### Custom Groups
**Location**: `/src/views/CustomGroupDialog/`
- Create action categories
- Set group properties
- Assign intensities
- Organize tiles

#### Custom Boards
**Location**: `/src/views/ManageGameBoards/`
- Design board layouts
- Configure tile distribution
- Save board templates
- Share boards

### Workflow
1. **Creation Phase**
   - Open custom content dialog
   - Choose content type
   - Enter details
   - Preview result

2. **Management Phase**
   - View all custom content
   - Edit as needed
   - Organize into groups
   - Test in game

3. **Sharing Phase**
   - Export configurations
   - Generate share links
   - Import from others
   - Community exchange

---

## Cast Mode

### Overview
External display support for showing game state on separate screen.

### Location
- **View**: `/src/views/Cast/index.tsx`
- **Types**: `/src/types/cast.ts`

### Features

#### Display Modes
- **Full Board**: Complete game view
- **Current Turn**: Focus on active player
- **Messages**: Chat display
- **Statistics**: Game progress

#### Privacy Controls
- Hide sensitive content
- Blur player names
- Mask messages
- Safe mode toggle

#### Synchronization
- Real-time updates
- Smooth animations
- Low latency
- Automatic reconnection

### Workflow
1. Open cast view in new window/device
2. Position on external display
3. Configure privacy settings
4. Start casting
5. Control from main device

---

## About & Help Section

### Overview
Educational and support content for users.

### Location
- **Game Guide**: `/src/views/GameGuide/index.tsx`
- **Styles**: `/src/views/GameGuide/styles.css`

### Content Sections

#### How to Play
- Game rules
- Turn mechanics
- Scoring system
- Win conditions

#### Features Guide
- Feature explanations
- Video tutorials
- Interactive demos
- Tips and tricks

#### FAQ Section
- Common questions
- Troubleshooting
- Best practices
- Safety guidelines

#### Community
- Discord link
- Reddit community
- Feature requests
- Bug reporting

---

## Progressive Web App Features

### Overview
Native app-like features through PWA technology.

### Manifest
**File**: `/public/manifest.json`

### Features

#### Installation
- Add to home screen prompt
- Desktop installation
- App icon and splash screen
- Standalone window mode

#### Offline Support
- Service worker caching
- Offline page
- Background sync
- Local data persistence

#### Native Features
- Push notifications (planned)
- Camera access for avatars
- File system access
- Share API integration

#### Performance
- App shell architecture
- Progressive enhancement
- Lazy loading
- Code splitting

### User Benefits
- 📱 Works like native app
- 🔌 Functions offline
- 🔄 Auto-updates
- 💾 Reduced data usage
- ⚡ Fast loading

---

## User Journey Maps

### New User Journey
1. **Discovery** → Landing page
2. **Onboarding** → Setup wizard
3. **Configuration** → Customize settings
4. **First Game** → Solo or guided mode
5. **Exploration** → Discover features
6. **Engagement** → Create custom content
7. **Social** → Join multiplayer
8. **Retention** → Regular play

### Returning User Journey
1. **Launch** → Quick start
2. **Resume** → Continue session
3. **Customize** → Adjust settings
4. **Play** → Active gameplay
5. **Create** → Custom content
6. **Share** → Community engagement

### Power User Journey
1. **Advanced Setup** → Skip wizard
2. **Bulk Creation** → Import configs
3. **Community** → Share content
4. **Host** → Manage rooms
5. **Optimize** → Performance tuning
6. **Contribute** → Feature requests

---

## Accessibility Features

### Visual Accessibility
- High contrast mode
- Font size controls
- Color blind modes
- Screen reader support

### Motor Accessibility
- Large touch targets
- Keyboard navigation
- Gesture alternatives
- Timing adjustments

### Cognitive Accessibility
- Simple mode
- Clear instructions
- Progress indicators
- Undo capabilities

---

## Security & Privacy

### Data Protection
- Local storage encryption
- Secure room codes
- Anonymous options
- Data minimization

### Content Safety
- Content filtering
- Report system
- Moderation tools
- Safe mode

### Account Security
- OAuth integration
- Password requirements
- Session management
- Account recovery

---

## Performance Optimizations

### Loading Performance
- Code splitting by route
- Lazy component loading
- Image optimization
- Resource hints

### Runtime Performance
- Virtual scrolling
- Debounced operations
- Memoization
- Worker threads

### Network Performance
- Request batching
- Caching strategies
- Compression
- CDN usage

---

## Analytics & Metrics

### User Metrics
- Active users
- Session duration
- Feature usage
- Retention rates

### Performance Metrics
- Load times
- Interaction delays
- Error rates
- Success rates

### Content Metrics
- Tiles created
- Boards shared
- Import/export usage
- Popular configurations