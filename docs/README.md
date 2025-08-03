# Blitzed Out - Business Requirements Document (BRD)

## Documentation Overview

This documentation serves as a comprehensive Business Requirements Document (BRD) for the **Blitzed Out** application. It covers all aspects of the product from business requirements to technical implementation details.

**Blitzed Out** is a customizable adult experience platform that transforms intimate adventures through gamification. The application supports solo play, couples, and group settings with extensive customization options and real-time multiplayer features.

## Table of Contents

### 📋 Business & Product Documentation

1. **[Application Overview](./01-application-overview.md)**
   - Product vision and goals
   - Target audience and personas
   - Key value propositions
   - Business objectives

2. **[User Features & Workflows](./02-user-features-workflows.md)**
   - Setup wizard workflow
   - Game settings management
   - Local players functionality
   - Solo mode features
   - Online multiplayer features
   - Room management
   - Cast mode for external displays
   - Progressive Web App (PWA) capabilities

3. **[Game Mechanics & Rules](./03-game-mechanics.md)**
   - Core gameplay loop
   - Board game system
   - Action/tile system
   - Intensity levels
   - Player roles (sub/dom/vers)
   - Turn management
   - Scoring and completion

### 🏗️ Technical Documentation

4. **[Technical Architecture](./04-technical-architecture.md)**
   - Technology stack
   - System architecture
   - Authentication system
   - Real-time features
   - Data synchronization
   - Offline-first design
   - Performance optimizations

5. **[Data Models & State Management](./05-data-models.md)**
   - Database schema (Dexie/IndexedDB)
   - Firebase data structures
   - State management (Zustand)
   - Data synchronization strategy
   - Migration system

6. **[UI/UX Components & Patterns](./06-ui-ux-components.md)**
   - Component library
   - Design system (Material-UI)
   - Dark mode theme
   - Responsive design patterns
   - Accessibility features
   - Internationalization (i18n)

### 📚 Reference Documentation

7. **[Internationalization Guidelines](./07-internationalization-guidelines.md)**
   - Translation file management
   - Multi-language workflow
   - Cultural adaptation guidelines
   - i18next implementation

8. **[API & Services Reference](./08-api-services.md)**
   - Firebase services
   - Local storage services
   - Synchronization services
   - Migration services
   - Custom hooks

9. **[Configuration & Settings](./09-configuration-settings.md)**
   - Application settings
   - Room settings
   - Board settings
   - Local player settings
   - Internationalization settings
   - Theme and appearance

10. **[Testing & Quality Assurance](./10-testing-qa.md)**
    - Testing strategy
    - Test coverage
    - Quality metrics
    - Performance benchmarks

11. **[Deployment & Operations](./11-deployment-operations.md)**
    - Build and deployment process
    - Environment configuration
    - Monitoring and analytics
    - Maintenance procedures

## Quick Reference

### Key Features at a Glance

| Feature           | Description                     | Key Files                                                          |
| ----------------- | ------------------------------- | ------------------------------------------------------------------ |
| **Setup Wizard**  | Guided onboarding for new users | `/src/views/GameSettingsWizard/`                                   |
| **Local Players** | Single-device multiplayer       | `/src/hooks/useLocalPlayers.ts`, `/src/stores/localPlayerStore.ts` |
| **Solo Mode**     | Single-player experience        | `/src/views/GameSettings/BoardSettings/SoloSwitch/`                |
| **Room System**   | Real-time multiplayer rooms     | `/src/views/Room/`, `/src/services/firebase.ts`                    |
| **Custom Tiles**  | User-generated content          | `/src/views/CustomTileDialog/`                                     |
| **Cast Mode**     | External display support        | `/src/views/Cast/`                                                 |
| **PWA Support**   | Installable web app             | `/public/manifest.json`, service workers                           |

### Technology Stack

- **Frontend Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite with SWC
- **UI Library**: Material-UI v7 (MUI)
- **State Management**: Zustand
- **Database**: Dexie (IndexedDB) + Firebase
- **Real-time**: Firebase Realtime Database & Firestore
- **Auth**: Firebase Authentication
- **Internationalization**: i18next
- **Testing**: Vitest + React Testing Library

### Project Structure

```
blitzed-out/
├── docs/                    # This documentation
├── src/
│   ├── components/         # Reusable UI components
│   ├── views/             # Page-level components
│   ├── stores/            # Zustand state stores
│   ├── services/          # Business logic & Firebase
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── locales/           # i18n translations
│   ├── context/           # React context providers
│   └── utils/             # Helper utilities
├── public/                # Static assets
└── tests/                 # Test files
```

## Document Conventions

- **📋** Business/Product sections
- **🏗️** Technical sections
- **📚** Reference sections
- **⚠️** Important warnings
- **💡** Tips and best practices
- **🔍** Deep dive sections
- **📁** File/folder references

## Getting Started

For developers new to the project:

1. Start with the [Application Overview](./01-application-overview.md)
2. Review [User Features & Workflows](./02-user-features-workflows.md)
3. Understand the [Technical Architecture](./04-technical-architecture.md)
4. Explore specific features as needed

For product managers and stakeholders:

1. Focus on [Application Overview](./01-application-overview.md)
2. Review [User Features & Workflows](./02-user-features-workflows.md)
3. Understand [Game Mechanics](./03-game-mechanics.md)

## Version History

- **Current Version**: 0.1.0
- **Last Updated**: 2025
- **Documentation Standard**: BRD v1.0
