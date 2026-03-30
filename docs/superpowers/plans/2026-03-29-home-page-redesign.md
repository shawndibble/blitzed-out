# Home Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic marketing home page with a screenshot-led landing page that shows what the game is, makes it trivial to start playing, and provides SEO-friendly content below the fold.

**Architecture:** Replace the `GameGuide` component with a new `HowItWorks` component. Update `UnauthenticatedApp` to restructure the hero section with a board screenshot and revised copy. Update all 5 locale files with new translation keys.

**Tech Stack:** React 19, TypeScript, Material-UI v7, i18next, Vite, CSS

**Spec:** `docs/superpowers/specs/2026-03-29-home-page-redesign-design.md`

---

## File Structure

| Action    | Path                                                                 | Responsibility                                                              |
| --------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Modify    | `src/views/UnauthenticatedApp/index.tsx`                             | Hero layout: screenshot + headline + form                                   |
| Modify    | `src/views/UnauthenticatedApp/styles.css`                            | Hero styling, responsive layout                                             |
| Rewrite   | `src/views/GameGuide/index.tsx`                                      | Replace with HowItWorks 3-step section                                      |
| Rewrite   | `src/views/GameGuide/styles.css`                                     | Styles for HowItWorks steps with screenshots                                |
| Modify    | `src/locales/en/translation.json`                                    | New English copy                                                            |
| Modify    | `src/locales/es/translation.json`                                    | New Spanish copy                                                            |
| Modify    | `src/locales/fr/translation.json`                                    | New French copy                                                             |
| Modify    | `src/locales/zh/translation.json`                                    | New Chinese copy                                                            |
| Modify    | `src/locales/hi/translation.json`                                    | New Hindi copy                                                              |
| Create    | `public/screenshots/`                                                | Directory for screenshot assets                                             |
| No change | `src/views/UnauthenticatedApp/__tests__/UnauthenticatedApp.test.tsx` | Existing tests mock GameGuide; component path unchanged so mocks still work |

---

### Task 1: Add Screenshot Assets

**Files:**

- Create: `public/screenshots/hero-board.webp`
- Create: `public/screenshots/setup-wizard.webp`
- Create: `public/screenshots/action-card.webp`
- Create: `public/screenshots/custom-tiles.webp`

The user has provided screenshots. They need to be saved as optimized WebP files.

- [ ] **Step 1: Create the screenshots directory**

```bash
mkdir -p public/screenshots
```

- [ ] **Step 2: Save and optimize the provided screenshots**

Convert the user's provided screenshots to WebP format and save them to `public/screenshots/`. Use a tool like `cwebp` or an online converter. Target file sizes under 150KB each. Name them:

- `hero-board.webp` — the dark-theme board view with colorful tiles
- `setup-wizard.webp` — the Game Mode Selection step of the setup wizard
- `action-card.webp` — the action card modal popup over the board
- `custom-tiles.webp` — the Manage Game Tiles panel showing categories

- [ ] **Step 3: Verify all 4 files exist and are reasonably sized**

```bash
ls -lh public/screenshots/
```

Expected: 4 `.webp` files, each under 150KB ideally (under 300KB acceptable for detailed screenshots).

- [ ] **Step 4: Commit**

```bash
git add public/screenshots/
git commit -m "feat: add screenshot assets for home page redesign"
```

---

### Task 2: Update Translation Files — English

**Files:**

- Modify: `src/locales/en/translation.json`

Add new translation keys for the redesigned page. Do NOT modify existing keys (`setup`, `setupSubtitle`, `anonymousLogin`) yet — those will be swapped out in Task 5 when the component is updated, avoiding a broken intermediate state.

- [ ] **Step 1: Add the following new keys to `src/locales/en/translation.json`**

```json
"playNow": "Play Now",
"noAccountRequired": "No account required",
"heroHeadline": "The Adult Board Game You Play in Your Browser",
"heroSubheadline": "Roll dice. Land on tiles. Do the dare. Play alone, with a partner, or with a group.",
"heroScreenshotAlt": "Game board showing colorful tiles with action categories like Kissing, Alcohol, and Confessions",
"howItWorksTitle": "How It Works",
"howItWorksStep1Title": "Pick Your Vibe",
"howItWorksStep1Desc": "A guided setup tailors the game to your mood. Choose your play style, set your intensity level from mild to explicit, and select the action categories you want on your board. Nothing shows up that you didn't ask for.",
"howItWorksStep1Alt": "Setup wizard showing game mode, role, and intensity options",
"howItWorksStep2Title": "Roll and Play",
"howItWorksStep2Desc": "A custom board is generated from your selections. Roll the dice to move across tiles — each one holds a dare, a drink, a confession, or something spicier. Hundreds of built-in actions across 20+ categories keep every game fresh.",
"howItWorksStep2Alt": "Action card popup showing a dare during gameplay",
"howItWorksStep3Title": "Make It Yours",
"howItWorksStep3Desc": "Add your own custom dares, pick from preset packs, or toggle entire categories on and off. Create a private room code and share it with your group — like Jackbox, but adults-only. Play on any device, cast to your TV, or video call a partner for long-distance games.",
"howItWorksStep3Alt": "Game tile management panel showing 20+ action categories with custom tile creation"
```

Do NOT remove old keys yet — they'll be cleaned up in Task 6 after the components stop referencing them.

- [ ] **Step 2: Verify the JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/locales/en/translation.json', 'utf8')); console.log('Valid JSON')"
```

Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add src/locales/en/translation.json
git commit -m "feat: update English translations for home page redesign"
```

---

### Task 3: Update Translation Files — es, fr, zh, hi

**Files:**

- Modify: `src/locales/es/translation.json`
- Modify: `src/locales/fr/translation.json`
- Modify: `src/locales/zh/translation.json`
- Modify: `src/locales/hi/translation.json`

Apply the same structural changes as English to all 4 remaining locale files. Translate the new copy into each language.

- [ ] **Step 1: Update Spanish translations (`src/locales/es/translation.json`)**

Same new keys as English, with Spanish translations. Add all `playNow`, `noAccountRequired`, `heroHeadline`, `heroSubheadline`, `howItWorks*` keys. Do NOT modify or remove existing keys yet.

- [ ] **Step 2: Update French translations (`src/locales/fr/translation.json`)**

Same structure, French translations.

- [ ] **Step 3: Update Chinese translations (`src/locales/zh/translation.json`)**

Same structure, Chinese translations.

- [ ] **Step 4: Update Hindi translations (`src/locales/hi/translation.json`)**

Same structure, Hindi translations.

- [ ] **Step 5: Verify all 4 JSON files are valid**

```bash
for lang in es fr zh hi; do
  node -e "JSON.parse(require('fs').readFileSync('src/locales/$lang/translation.json', 'utf8')); console.log('$lang: Valid JSON')"
done
```

Expected: All 4 print `Valid JSON`.

- [ ] **Step 6: Commit**

```bash
git add src/locales/es/ src/locales/fr/ src/locales/zh/ src/locales/hi/
git commit -m "feat: update es/fr/zh/hi translations for home page redesign"
```

---

### Task 4: Rewrite GameGuide as HowItWorks

**Files:**

- Rewrite: `src/views/GameGuide/index.tsx`
- Rewrite: `src/views/GameGuide/styles.css`

Replace the entire GameGuide component with a HowItWorks section. Keep the file path the same since `UnauthenticatedApp` imports from `@/views/GameGuide`. Internally, the component renders the 3-step "How It Works" section with screenshots.

- [ ] **Step 1: Write the failing test for HowItWorks rendering**

Create `src/views/GameGuide/__tests__/GameGuide.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
  }),
}));

import GameGuide from '../index';

describe('GameGuide (HowItWorks)', () => {
  it('renders the how it works title', () => {
    render(<GameGuide />);
    expect(screen.getByText('howItWorksTitle')).toBeInTheDocument();
  });

  it('renders all 3 step titles', () => {
    render(<GameGuide />);
    expect(screen.getByText('howItWorksStep1Title')).toBeInTheDocument();
    expect(screen.getByText('howItWorksStep2Title')).toBeInTheDocument();
    expect(screen.getByText('howItWorksStep3Title')).toBeInTheDocument();
  });

  it('renders all 3 step descriptions', () => {
    render(<GameGuide />);
    expect(screen.getByText('howItWorksStep1Desc')).toBeInTheDocument();
    expect(screen.getByText('howItWorksStep2Desc')).toBeInTheDocument();
    expect(screen.getByText('howItWorksStep3Desc')).toBeInTheDocument();
  });

  it('renders 3 screenshot images with alt text', () => {
    render(<GameGuide />);
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute('alt', 'howItWorksStep1Alt');
    expect(images[1]).toHaveAttribute('alt', 'howItWorksStep2Alt');
    expect(images[2]).toHaveAttribute('alt', 'howItWorksStep3Alt');
  });

  it('renders step numbers 1, 2, 3', () => {
    render(<GameGuide />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test:failures
```

Expected: FAIL — GameGuide still renders old content.

- [ ] **Step 3: Rewrite `src/views/GameGuide/index.tsx`**

```tsx
import './styles.css';

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const steps = [
  {
    titleKey: 'howItWorksStep1Title',
    descKey: 'howItWorksStep1Desc',
    altKey: 'howItWorksStep1Alt',
    image: '/screenshots/setup-wizard.webp',
  },
  {
    titleKey: 'howItWorksStep2Title',
    descKey: 'howItWorksStep2Desc',
    altKey: 'howItWorksStep2Alt',
    image: '/screenshots/action-card.webp',
  },
  {
    titleKey: 'howItWorksStep3Title',
    descKey: 'howItWorksStep3Desc',
    altKey: 'howItWorksStep3Alt',
    image: '/screenshots/custom-tiles.webp',
  },
];

export default function GameGuide() {
  const { t } = useTranslation();

  return (
    <Box className="how-it-works">
      <Typography component="h2" variant="h5" className="how-it-works-title">
        {t('howItWorksTitle')}
      </Typography>

      {steps.map((step, index) => (
        <Box
          key={step.titleKey}
          className={`how-it-works-step ${index % 2 === 1 ? 'step-reverse' : ''}`}
        >
          <Box className="step-image-container">
            <img
              src={step.image}
              alt={t(step.altKey)}
              className="step-image"
              loading="lazy"
              width={600}
              height={400}
            />
          </Box>
          <Box className="step-content">
            <Box className="step-number-badge">{index + 1}</Box>
            <Typography component="h3" variant="h6" className="step-title">
              {t(step.titleKey)}
            </Typography>
            <Typography variant="body1" className="step-description">
              {t(step.descKey)}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
```

- [ ] **Step 4: Rewrite `src/views/GameGuide/styles.css`**

```css
/* How It Works Section */
.how-it-works {
  padding: 1rem 0;
}

.how-it-works-title {
  text-align: center;
  font-weight: 700;
  color: var(--color-accent, #22d3ee);
  margin-bottom: 2rem;
}

body.theme-light .how-it-works-title {
  color: var(--color-accent-light, #0891b2);
}

/* Each step: image + text side by side */
.how-it-works-step {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  align-items: center;
}

/* Reverse layout for alternating steps on desktop */
@media screen and (min-width: 768px) {
  .how-it-works-step {
    flex-direction: row;
    gap: 2rem;
  }

  .how-it-works-step.step-reverse {
    flex-direction: row-reverse;
  }

  .step-image-container,
  .step-content {
    flex: 1;
  }
}

/* Screenshot images */
.step-image-container {
  width: 100%;
}

.step-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--container-border);
  box-shadow: var(--shadow-md);
}

/* Step content */
.step-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.step-number-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.step-title {
  font-weight: 600;
  color: var(--color-white-95);
}

.step-description {
  color: var(--color-white-80);
  line-height: 1.6;
  font-size: 0.95rem;
}

/* Light mode */
body.theme-light .step-title {
  color: var(--color-white-95);
}

body.theme-light .step-description {
  color: var(--color-white-80);
}

body.theme-light .step-image {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npm run test:failures
```

Expected: PASS — all GameGuide tests green.

- [ ] **Step 6: Commit**

```bash
git add src/views/GameGuide/
git commit -m "feat: replace GameGuide with HowItWorks screenshot section"
```

---

### Task 5: Update UnauthenticatedApp Hero Section

**Files:**

- Modify: `src/views/UnauthenticatedApp/index.tsx`
- Modify: `src/views/UnauthenticatedApp/styles.css`

Restructure the hero section: add the board screenshot, update headline/subheadline copy, change CTA to "Play Now", simplify auth buttons to text links.

- [ ] **Step 1: Update the test mock to expect new content**

In `src/views/UnauthenticatedApp/__tests__/UnauthenticatedApp.test.tsx`, the existing tests mock `GameGuide` so they won't break. No test changes needed for the hero since the tests use a mock `GameGuide`. The language tests are self-contained with `LanguageSwitcher` and remain valid.

Verify existing tests still pass:

```bash
npm run test:failures
```

- [ ] **Step 2: Update `src/views/UnauthenticatedApp/index.tsx`**

Key changes to the JSX:

1. Add hero screenshot image above/beside the form using `heroScreenshotAlt` for alt text, `loading="eager"`, `fetchPriority="high"`
2. Replace `<h1 className="setup"><Trans i18nKey="setup" /></h1>` with `heroHeadline` key
3. Replace `setupSubtitle` Typography with `heroSubheadline` key
4. Add "No account required" helper text below the Play Now button using new `noAccountRequired` key
5. Change submit button text from `anonymousLogin` to `playNow` key
6. Remove `<PersonAdd />` icon from the submit button (cleaner CTA)
7. Change auth buttons from `variant="outlined"` to `variant="text"` (subtle text links per spec)
8. Change the Grid layout: screenshot column `xs:12, md:6, lg:7`, form column `xs:12, md:6, lg:5`, "How It Works" full-width below

**Elements that MUST be preserved from existing code (do not drop these):**

- `TextField` with `id="displayName"`, `autoFocus`, `onKeyDown={onEnterKey}`, `required`
- Error display `Box` with `loginError || authError` conditional
- Submit `Button` with ALL existing `sx` props (touchAction, cursor, focus outline, userSelect)
- Submit `Button` onClick handler for Firefox mobile support
- `hasImport` conditional for import button text
- `loginLoading` state: disabled button + CircularProgress spinner
- `Divider` between submit and auth buttons
- Sign In button with `handleOpenLogin` onClick
- Create Account button with `handleOpenRegister` onClick
- Footer language selector (unchanged)
- `AuthDialog` component (unchanged)

The form logic (handleSubmit, onEnterKey, auth dialog, language selector, error handling) remains unchanged.

Replace the Grid layout section (lines 158-278) with:

```tsx
<Grid container spacing={4} justifyContent="center" alignItems="center">
  {/* Hero Screenshot - visible on desktop */}
  <Grid size={{ xs: 12, md: 6, lg: 7 }}>
    <Box className="hero-screenshot-container">
      <Typography component="h1" variant="h4" className="hero-headline">
        {t('heroHeadline')}
      </Typography>
      <Typography variant="body1" className="hero-subheadline">
        {t('heroSubheadline')}
      </Typography>
      <img
        src="/screenshots/hero-board.webp"
        alt={t('heroScreenshotAlt')}
        className="hero-screenshot"
        loading="eager"
        fetchPriority="high"
        width={800}
        height={500}
      />
    </Box>
  </Grid>

  {/* Main Setup Card */}
  <Grid size={{ xs: 12, md: 6, lg: 5 }}>
    <Card className="unauthenticated-card main-setup-card">
      <CardContent>
        {/* Mobile-only headline (hidden on desktop since it's in the left column) */}
        <Box className="mobile-hero-text">
          <Typography component="h1" variant="h5" className="hero-headline">
            {t('heroHeadline')}
          </Typography>
          <Typography variant="body1" className="hero-subheadline">
            {t('heroSubheadline')}
          </Typography>
        </Box>

        <Box component="form" method="post" onSubmit={handleSubmit} className="settings-box">
          {/* Preserve existing TextField, error display Box, and Button exactly as-is */}
          {/* EXCEPT: change Button text from anonymousLogin to playNow key */}
          {/* EXCEPT: remove PersonAdd startIcon from Button (keep CircularProgress for loading) */}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          {t('noAccountRequired')}
        </Typography>

        <Divider sx={{ my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <Trans i18nKey="or" />
          </Typography>
        </Divider>

        <Box className="auth-button-container">
          <Button variant="text" onClick={handleOpenLogin} size="medium">
            <Trans i18nKey="signIn" />
          </Button>
          <Button variant="text" onClick={handleOpenRegister} size="medium">
            <Trans i18nKey="createAccount" />
          </Button>
        </Box>
      </CardContent>
    </Card>
  </Grid>

  {/* How It Works - Below the fold */}
  <Grid size={12}>
    <Card className="unauthenticated-card">
      <CardContent>
        <GameGuide />
      </CardContent>
    </Card>
  </Grid>
</Grid>
```

Remove these unused imports: `PersonAdd` and `Login` (no longer used on auth buttons).

**Note on `srcset`:** The spec recommends responsive image delivery with `srcset`. This is deferred to a follow-up optimization pass — generating multiple image sizes (400w, 800w, 1200w) for each screenshot requires an image processing pipeline that adds scope. The single WebP images with `max-width: 100%` CSS will work correctly on all screen sizes; they'll just download full-size on mobile. This is acceptable for 4 screenshots under 300KB each.

- [ ] **Step 3: Update `src/views/UnauthenticatedApp/styles.css`**

Add hero screenshot styles:

```css
/* Hero Screenshot */
.hero-screenshot-container {
  text-align: center;
}

.hero-screenshot {
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--container-border);
  box-shadow: var(--shadow-lg);
  margin-top: 1.5rem;
}

.hero-headline {
  font-weight: 700;
  color: var(--color-accent, #22d3ee);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

body.theme-light .hero-headline {
  color: var(--color-accent-light, #0891b2);
}

.hero-subheadline {
  color: var(--color-white-80);
  line-height: 1.5;
  margin-top: 0.75rem;
}

/* Show hero text in screenshot column on desktop, hide on mobile */
.hero-screenshot-container .hero-headline,
.hero-screenshot-container .hero-subheadline {
  display: none;
}

/* Show mobile hero text in card on mobile, hide on desktop */
.mobile-hero-text {
  text-align: center;
  margin-bottom: 1.5rem;
}

@media screen and (min-width: 768px) {
  .hero-screenshot-container .hero-headline,
  .hero-screenshot-container .hero-subheadline {
    display: block;
  }

  .mobile-hero-text {
    display: none;
  }
}
```

Remove old `.setup` and `.setup-subtitle` styles (replaced by `.hero-headline` and `.hero-subheadline`).

- [ ] **Step 4: Run all tests**

```bash
npm run test:failures
```

Expected: All tests pass.

- [ ] **Step 5: Visual check — verify the dev server shows the new layout**

Open the browser and verify:

- Desktop: screenshot on left, form on right, "How It Works" below
- Mobile: headline, form, then "How It Works" below
- Screenshots load correctly
- "Play Now" button works
- Sign In / Create Account still work

- [ ] **Step 6: Commit**

```bash
git add src/views/UnauthenticatedApp/
git commit -m "feat: redesign hero section with board screenshot and updated copy"
```

---

### Task 6: Cleanup and Final Verification

**Files:**

- Various

- [ ] **Step 1: Run type checking**

```bash
npm run type-check
```

Expected: No type errors.

- [ ] **Step 2: Run linting**

```bash
npx eslint src/
```

Expected: No lint errors.

- [ ] **Step 3: Run all tests**

```bash
npm run test:failures
```

Expected: All tests pass.

- [ ] **Step 4: Remove unused imports and dead code**

- Remove `PersonAdd` and `Login` from UnauthenticatedApp imports (no longer used)
- Remove old Accordion imports from GameGuide (already handled in Task 4 rewrite)
- Remove the `console.error` on line 134 of UnauthenticatedApp (per CLAUDE.md: no logging in production code)

- [ ] **Step 5: Remove old translation keys from all 5 locale files**

Now that the components no longer reference them, remove these keys from all 5 locale files (en, es, fr, zh, hi):

- `setup` (replaced by `heroHeadline`)
- `setupSubtitle` (replaced by `noAccountRequired`)
- `anonymousLogin` (replaced by `playNow`)
- `gameDesc`
- `whySpecialTitle`
- `customizationFeature`
- `privacyFeature`
- `varietyFeature`
- `gettingStartedTitle`
- `gettingStartedMainText`
- `gettingStartedTip`

**Important:** Before removing `setup`, `setupSubtitle`, and `anonymousLogin`, grep the codebase to confirm no other component uses them:

```bash
grep -r '"setup"' src/ --include="*.tsx" --include="*.ts" | grep -v test | grep -v node_modules
grep -r 'setupSubtitle' src/ --include="*.tsx" --include="*.ts" | grep -v test | grep -v node_modules
grep -r 'anonymousLogin' src/ --include="*.tsx" --include="*.ts" | grep -v test | grep -v node_modules
```

Only remove keys that are no longer referenced.

- [ ] **Step 6: Verify all 5 locale files have the same set of new keys**

```bash
for lang in en es fr zh hi; do
  echo "=== $lang ==="
  node -e "const t = JSON.parse(require('fs').readFileSync('src/locales/$lang/translation.json','utf8')); console.log('heroHeadline:', !!t.heroHeadline, 'howItWorksStep3Desc:', !!t.howItWorksStep3Desc)"
done
```

Expected: All 5 show `true` for both keys.

- [ ] **Step 7: Final commit if any cleanup was needed**

```bash
git add -A
git commit -m "chore: cleanup dead code from home page redesign"
```
