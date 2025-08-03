# Game Mechanics & Rules

## Overview

Blitzed Out is a board game-style experience where players progress through tiles containing actions of varying intensities. The game supports multiple play modes and can be customized extensively to match player preferences and comfort levels.

## Core Game Loop

### Basic Flow
1. **Roll Dice** → Determine movement
2. **Move Token** → Advance on board
3. **Land on Tile** → Reveal action
4. **Perform Action** → Complete or skip
5. **Next Turn** → Continue play
6. **Reach Finish** → Complete game

### Turn Sequence

#### Single Player (Solo Mode)
```
Roll → Move → Action → Roll (repeat)
```

#### Multiplayer (Online/Local)
```
Player A Roll → Move → Action → 
Player B Roll → Move → Action → 
Player C Roll → Move → Action → 
(cycle continues)
```

## Board System

### Board Structure
**Component**: `/src/views/Room/GameBoard/index.tsx`

#### Board Properties
```typescript
interface GameBoard {
  tiles: Tile[];        // Array of board tiles
  size: number;         // Total tile count
  finishRange: [number, number]; // Min/max for finish
  layout: 'spiral' | 'grid';    // Board layout
}
```

#### Tile System
**Component**: `/src/views/Room/GameBoard/GameTile/index.tsx`

```typescript
interface Tile {
  id: number;          // Tile position
  action?: Action;     // Associated action
  type: TileType;      // Regular, special, finish
  intensity?: number;  // 1-5 scale
  group?: string;      // Action category
}
```

### Board Sizes

| Size | Tiles | Duration | Best For |
|------|-------|----------|----------|
| **Quick** | 10-20 | 15-30 min | Quick sessions |
| **Standard** | 21-40 | 30-60 min | Regular play |
| **Extended** | 41-60 | 60-90 min | Longer sessions |
| **Marathon** | 61-100 | 90+ min | Extended play |

### Special Tiles

#### Start Tile
- Position 0
- No action
- All players begin here

#### Finish Zone
- Variable end point
- Range defined by settings
- First to reach wins (multiplayer)
- Game completion (solo)

#### Action Tiles
- Contain game actions
- Color-coded by intensity
- May have special effects

## Action System

### Action Structure
**Helper**: `/src/helpers/actionsFolder.ts`

```typescript
interface Action {
  id: string;
  text: string;         // Action description
  type: string;         // Action category
  level: number;        // Intensity (1-5)
  variation?: string;   // Optional variant
  role?: PlayerRole;    // Target role
  group: string;        // Category group
}
```

### Action Categories

#### Default Groups
**Location**: `/src/constants/actionConstants.ts`

1. **Warm-Up Actions**
   - Intensity: 1-2
   - Examples: Simple tasks, ice breakers
   - Purpose: Game start, comfort building

2. **Moderate Actions**
   - Intensity: 2-3
   - Examples: Interactive tasks
   - Purpose: Main gameplay

3. **Intense Actions**
   - Intensity: 4-5
   - Examples: Advanced challenges
   - Purpose: Experienced players

4. **Special Actions**
   - Variable intensity
   - Examples: Wild cards, player choice
   - Purpose: Game variety

### Custom Groups
**Component**: `/src/views/CustomGroupDialog/`

Users can create custom action categories:
- Define group name
- Set intensity range
- Assign actions
- Configure frequency

## Intensity Levels

### Scale Definition

| Level | Name | Description | Color |
|-------|------|-------------|-------|
| **1** | Mild | Gentle, introductory | Green |
| **2** | Warm | Comfortable, easy | Light Blue |
| **3** | Moderate | Standard difficulty | Blue |
| **4** | Spicy | Challenging | Orange |
| **5** | Wild | Maximum intensity | Red |

### Intensity Selection
**Component**: `/src/components/IntensitySelector/`

#### Selection Modes
1. **Single Level**: One intensity only
2. **Range**: Min to max range
3. **Mixed**: Multiple non-consecutive
4. **Progressive**: Increases over time

#### Intensity Templates
```typescript
const templates = {
  beginner: [1, 2],
  intermediate: [2, 3, 4],
  advanced: [3, 4, 5],
  mixed: [1, 3, 5],
  progressive: 'increases each round'
};
```

## Player Roles

### Role System
**Type**: `PlayerRole = 'sub' | 'dom' | 'vers'`

#### Submissive (sub)
- Receives actions
- Follows instructions
- Responsive role

#### Dominant (dom)
- Gives actions
- Leads interactions
- Directive role

#### Versatile (vers)
- Both roles
- Flexible position
- Adapts to situation

### Role-Based Actions
Actions can be filtered by role:
- Sub-specific actions
- Dom-specific actions
- Vers/neutral actions
- Role-reversal actions

## Turn Management

### Turn Systems

#### Standard Turns
**Hook**: `/src/hooks/usePlayerMove.ts`

1. **Sequential**: Players take turns in order
2. **Time-Limited**: Optional turn timer
3. **Skip Option**: Pass turn if needed
4. **Pause/Resume**: Game can be paused

#### Local Player Turns
**Hook**: `/src/hooks/useLocalPlayers.ts`

```typescript
interface TurnManager {
  currentPlayer: LocalPlayer;
  nextPlayer: () => void;
  previousPlayer: () => void;
  skipTurn: () => void;
}
```

Features:
- Visual turn indicator
- Audio notifications
- Turn history
- Player switching animation

### Turn Indicators
**Component**: `/src/components/TurnIndicator/`

- Current player highlight
- Turn order display
- Time remaining (if timed)
- Action status

## Dice System

### Dice Types
**Component**: `/src/views/Room/RollButton/`

#### Standard Dice
- **D6**: 1-6 (default)
- **D4**: 1-4 (shorter moves)
- **D8**: 1-8 (longer moves)
- **D10**: 1-10 (extended)
- **D20**: 1-20 (maximum variety)

#### Special Dice
- **Custom Range**: User-defined min/max
- **Weighted**: Biased probabilities
- **Multiple Dice**: Sum of rolls
- **Choice Dice**: Pick from options

### Roll Mechanics
```typescript
interface RollResult {
  value: number;      // Roll result
  dice: string;       // Dice type used
  timestamp: number;  // When rolled
  player: string;     // Who rolled
}
```

## Scoring & Completion

### Solo Mode Completion
- Reach finish zone
- Complete all tiles
- Achieve target score
- Time-based completion

### Multiplayer Winning
- **First to Finish**: Classic race
- **Points System**: Accumulate points
- **Objectives**: Complete challenges
- **Elimination**: Last player standing

### Scoring Systems

#### Point-Based Scoring
```typescript
interface ScoreSystem {
  tilePoints: number;      // Points per tile
  intensityBonus: number;  // Bonus for difficulty
  speedBonus: number;      // Time-based bonus
  completionBonus: number; // Finishing bonus
}
```

#### Achievement System (Planned)
- First-time achievements
- Milestone rewards
- Streak bonuses
- Special challenges

## Game Modes

### Solo Mode
**Setting**: `gameMode: 'solo'`

Features:
- Self-paced play
- No turn limits
- Save/resume capability
- Personal statistics
- Offline play

Mechanics:
- Roll and move freely
- Skip actions without penalty
- Adjust difficulty mid-game
- Track personal progress

### Online Multiplayer
**Setting**: `gameMode: 'online'`

Features:
- Real-time synchronization
- 2-8 players per room
- Public or private rooms
- Chat system
- Spectator mode

Mechanics:
- Synchronized turns
- Action verification
- Connection recovery
- Anti-cheat measures

### Local Multiplayer
**Setting**: `gameMode: 'local'`

Features:
- 2-8 players on one device
- Turn notifications
- Player management
- Quick switching

Mechanics:
- Pass device between players
- Audio/visual turn alerts
- Privacy screens between turns
- Combined statistics

## Special Features

### Timer System
**Component**: `/src/views/Room/CustomTimerDialog/`

#### Timer Types
1. **Turn Timer**: Limit per turn
2. **Action Timer**: Time to complete action
3. **Game Timer**: Total game duration
4. **Countdown**: Special challenges

#### Timer Settings
```typescript
interface TimerConfig {
  type: 'turn' | 'action' | 'game';
  duration: number;      // Seconds
  warning: number;       // Warning threshold
  autoSkip: boolean;     // Skip on expire
  sound: boolean;        // Audio alerts
}
```

### Custom Rules

#### House Rules
Users can define custom rules:
- Modified win conditions
- Special tile effects
- Bonus actions
- Penalty systems
- Team play options

#### Rule Templates
```typescript
const ruleTemplates = {
  classic: 'Standard rules',
  speed: 'Timed turns, quick play',
  challenge: 'Increased difficulty',
  party: 'Group-friendly rules',
  custom: 'User-defined rules'
};
```

### Power-Ups (Planned)

#### Power-Up Types
- **Skip**: Bypass current tile
- **Reroll**: Roll dice again
- **Choose**: Pick next action
- **Swap**: Trade positions
- **Shield**: Protect from action

## Game Balance

### Difficulty Curves

#### Linear Progression
- Steady intensity increase
- Predictable difficulty
- Good for beginners

#### Variable Progression
- Mixed intensities
- Surprises and variety
- Experienced players

#### Adaptive Difficulty
- Adjusts to player performance
- Dynamic intensity
- Personalized experience

### Fairness Mechanisms

#### Random Distribution
- Actions shuffled fairly
- No player advantage
- Equal opportunity

#### Catch-Up Mechanics
- Bonus for trailing players
- Reduced difficulty when behind
- Comeback opportunities

## Statistics & Tracking

### Game Statistics
**Service**: `/src/services/statisticsService.ts`

#### Tracked Metrics
```typescript
interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  tilesCompleted: number;
  actionsPerformed: number;
  averageIntensity: number;
  totalPlayTime: number;
  favoriteActions: string[];
}
```

#### Session Statistics
- Current position
- Actions completed
- Time elapsed
- Intensity average
- Turn count

### Progress Tracking

#### Visual Progress
- Board position marker
- Completion percentage
- Progress bar
- Mini-map view

#### Analytics
- Heat maps of tile visits
- Action frequency
- Completion rates
- Player patterns

## Customization Options

### Board Customization
- Tile count adjustment
- Custom tile placement
- Special zones
- Visual themes

### Action Customization
- Create custom actions
- Import action sets
- Modify intensities
- Category management

### Rule Customization
- Win conditions
- Turn mechanics
- Scoring systems
- Special effects

## Game Flow Examples

### Quick Game Flow
```
1. Quick setup (10 tiles, intensity 1-2)
2. Roll D4 for smaller moves
3. Complete simple actions
4. 15-minute session
5. Casual completion
```

### Standard Game Flow
```
1. Normal setup (30 tiles, intensity 2-4)
2. Roll D6 standard dice
3. Mixed action difficulty
4. 45-minute session
5. Competitive finish
```

### Extended Game Flow
```
1. Full setup (60+ tiles, intensity 1-5)
2. Roll D8/D10 for variety
3. Progressive difficulty
4. 90+ minute session
5. Achievement hunting
```

## Balancing Considerations

### Player Engagement
- Variety prevents repetition
- Surprises maintain interest
- Progression provides goals
- Customization ensures relevance

### Difficulty Balance
- Easy start for onboarding
- Gradual difficulty increase
- Peak challenges at midpoint
- Satisfying conclusion

### Time Management
- Flexible game lengths
- Pause/resume capability
- Quick play options
- Marathon modes

## Future Mechanics (Planned)

### Advanced Features
- Team play modes
- Tournament system
- Seasonal events
- Daily challenges
- Leaderboards

### Social Features
- Spectator mode
- Play recording
- Share replays
- Community challenges
- User tournaments