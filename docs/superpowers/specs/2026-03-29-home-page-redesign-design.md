# Home Page Redesign — Design Spec

## Problem

The current home page uses generic marketing copy ("Transform Your Intimate Adventures", "vibrant community") that doesn't explain what the game is, oversells features that don't exist (community), and fails to convert visitors into players. Visitors have no idea they're looking at a board game.

## Goals

1. Show visitors what the game is within 5 seconds
2. Make it dead simple to start playing (name input above the fold)
3. Provide enough descriptive text below the fold for SEO and curious visitors
4. Be direct about the adult nature without being overwhelming
5. Speak to all audiences equally: solo players, couples, friend groups, poly/ENM groups

## Design Principles

- **Show, don't tell** — screenshots do the heavy lifting, copy confirms what you see
- **Low friction first** — the game is free with no signup; the page shouldn't oversell
- **Honest copy** — no fake community claims, no buzzwords, no filler
- **Inclusive language** — "alone, with a partner, or with a group" covers all relationship structures without naming them

## Page Structure

### Section 1: Hero (Above the Fold)

**Layout:** Board screenshot (dark theme, colorful tiles) as a prominent visual alongside the name input form. On desktop, two-column: visual left, form right (or vice versa). On mobile, stacked: headline, screenshot, form.

**Content:**

- **Headline:** "The Adult Board Game You Play in Your Browser"
- **Subheadline:** "Roll dice. Land on tiles. Do the dare. Play alone, with a partner, or with a group."
- **Form:** Display name input + "Play Now" button (replaces current "Enter Session")
- **Helper text:** "No account required" beneath the button
- **Secondary actions:** "Sign In" / "Create Account" as subtle text links (not prominent buttons)

**Screenshot used:** Board view (dark theme) — shows colorful tiles with action categories (Kissing, Alcohol, Confessions, Stripping) so visitors immediately understand the game format.

### Section 2: How It Works (Below the Fold)

**Layout:** 3-step vertical or horizontal sequence. Each step has a screenshot paired with a title and short description. On desktop, alternating left/right image placement. On mobile, stacked.

**Step 1 — "Pick Your Vibe"**

- **Screenshot:** Setup Wizard (Game Mode Selection step)
- **Description:** "A guided setup tailors the game to your mood. Choose your play style, set your intensity level from mild to explicit, and select the action categories you want on your board. Nothing shows up that you didn't ask for."

**Step 2 — "Roll and Play"**

- **Screenshot:** Action Card Modal (showing a dare popup over the board)
- **Description:** "A custom board is generated from your selections. Roll the dice to move across tiles — each one holds a dare, a drink, a confession, or something spicier. Hundreds of built-in actions across 20+ categories keep every game fresh."

**Step 3 — "Make It Yours"**

- **Screenshot:** Manage Game Tiles (showing categories and custom tile creation)
- **Description:** "Add your own custom dares, pick from preset packs, or toggle entire categories on and off. Create a private room code and share it with your group — like Jackbox, but adults-only. Play on any device, cast to your TV, or video call a partner for long-distance games."

## What Gets Removed

- "Transform Your Intimate Adventures" hero text
- "vibrant community" claim
- "What Makes This Special?" feature cards (Unlimited Customization, Complete Privacy Control, Endless Variety)
- "Ready to Begin?" accordion section
- "Join the Experience" / "Enter Session" CTA labels
- All generic marketing copy

## What Gets Added

- Board screenshot as hero visual
- "Play Now" CTA label
- "No account required" helper text
- "How It Works" section with 3 annotated screenshots
- SEO-friendly descriptive text woven into step descriptions

## Screenshots Required

Static screenshots stored in `public/screenshots/` as optimized WebP images. Below-fold images should use `loading="lazy"` for performance. On mobile, screenshots should scale to full container width with `max-width: 100%`.

1. **Board view (dark theme)** — `hero-board.webp` — the colorful tile board showing action categories
2. **Setup wizard** — `setup-wizard.webp` — the Game Mode Selection step showing intensity/role options
3. **Action card modal** — `action-card.webp` — a dare popup overlaying the board during gameplay
4. **Manage Game Tiles** — `custom-tiles.webp` — the customization panel showing categories and custom tile creation

## i18n Impact

All new copy must be added to all 5 translation files (en, es, fr, zh, hi). The existing translation keys for the removed GameGuide content can be cleaned up.

## Components Affected

- `src/views/UnauthenticatedApp/index.tsx` — main page layout, form, hero section
- `src/views/UnauthenticatedApp/styles.css` — hero styling
- `src/views/GameGuide/index.tsx` — replaced entirely with "How It Works" section
- `src/views/GameGuide/styles.css` — updated for new layout
- `src/locales/*/translation.json` — all 5 language files updated

## UI/UX Guidelines (from UI/UX Pro Max analysis)

### Accessibility

- All screenshots must have descriptive `alt` text (e.g., "Game board showing colorful tiles with action categories like Kissing, Alcohol, and Confessions")
- "Play Now" button and name input must have visible focus rings for keyboard navigation
- Text contrast minimum 4.5:1 ratio against dark backgrounds — verify with MUI dark theme tokens
- "No account required" helper text must not be too low contrast (avoid grey-on-dark-grey)
- Respect `prefers-reduced-motion` if any entrance animations are added

### Performance

- Hero screenshot (`hero-board.webp`) should be eager-loaded (above the fold) — do NOT lazy load it
- Below-fold screenshots (`setup-wizard.webp`, `action-card.webp`, `custom-tiles.webp`) use `loading="lazy"`
- All images must declare `width` and `height` attributes (or use `aspect-ratio` in CSS) to prevent Cumulative Layout Shift (CLS)
- Use `srcset` with multiple sizes for responsive image delivery (e.g., 400w, 800w, 1200w)
- Images should be compressed to reasonable file sizes (target <150KB per screenshot)

### Layout

- Mobile-first: design for 375px, then scale up to 768px, 1024px, 1440px
- Use MUI's 8px spacing scale consistently
- Hero section: name input + button must have minimum 44x44px touch targets
- "How It Works" section: on desktop, alternating left/right screenshot placement for visual rhythm; on mobile, stacked vertically
- Screenshots scale with `max-width: 100%; height: auto`
- Content max-width container on desktop (e.g., `max-width: 1200px`) to maintain readable line lengths

### Interaction

- "Play Now" button should show loading state during form submission (disable + spinner)
- Hover states on interactive elements with smooth 150-300ms transitions
- `cursor: pointer` on all clickable elements

### Dark Mode Specifics

- Use MUI semantic color tokens (`theme.palette.background.paper`, `theme.palette.text.primary`) — no hardcoded hex values
- Screenshot borders/shadows should use subtle elevation to separate from dark background
- Ensure step numbers/titles in "How It Works" have sufficient contrast against dark surfaces

## Out of Scope

- Authenticated app layout changes
- Game mechanics changes
- New features or functionality
- Navigation changes
