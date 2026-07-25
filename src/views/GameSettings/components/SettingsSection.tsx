import { Box, Chip, Typography } from '@mui/material';
import { JSX, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SCOPE_COLORS, SettingsScope } from './scopeColors';

const SCOPE_LABEL_KEYS: Record<SettingsScope, string> = {
  setup: 'scopeSetup',
  room: 'scopeRoom',
  board: 'scopeBoard',
  me: 'scopeMe',
};

interface SettingsSectionProps {
  id: string;
  scope: SettingsScope;
  title: string;
  /** Extra summary text next to the title (e.g. enabled count). */
  summary?: string;
  /** Optional control rendered on the section header (e.g. an Add button). */
  action?: ReactNode;
  /** Extra px of scroll-margin, for sections landing under a sticky footprint. */
  scrollOffsetExtra?: number;
  /**
   * Draws the scope accent around the section body. Used for the setup
   * questions, which drive every section below them and so must not be
   * skipped — the emphasis replaces the sticky bar they used to need.
   */
  emphasis?: boolean;
  children: ReactNode;
}

/**
 * One settings section: a plain, always-open block in the single scrolling
 * page — same treatment on mobile and desktop. JumpNav's chip row (mobile)
 * / rail (desktop) is the sole navigation aid; nothing collapses.
 */
export default function SettingsSection({
  id,
  scope,
  title,
  summary,
  action,
  scrollOffsetExtra = 0,
  emphasis = false,
  children,
}: SettingsSectionProps): JSX.Element {
  const { t } = useTranslation();
  const scopeColor = SCOPE_COLORS[scope];

  const scopeChip = (
    <Chip
      label={t(SCOPE_LABEL_KEYS[scope])}
      size="small"
      sx={{
        color: scopeColor,
        bgcolor: `${scopeColor}20`,
        fontSize: '0.65rem',
        height: 20,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}
    />
  );

  return (
    // Mobile's sticky header stack (title bar + JumpNav chip row) is taller
    // than desktop's (title bar only) — scrollMarginTop must clear each.
    // scrollOffsetExtra additionally clears PlayingCard's own sticky footprint
    // for every section rendered below it.
    <Box
      id={id}
      component="section"
      sx={{
        scrollMarginTop: { xs: 96 + scrollOffsetExtra, sm: 72 + scrollOffsetExtra },
        mb: 4,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
        {scopeChip}
        <Typography variant="h6" component="h3">
          {title}
        </Typography>
        {summary && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {summary}
          </Typography>
        )}
        {action && <Box sx={{ ml: 'auto' }}>{action}</Box>}
      </Box>
      {emphasis ? (
        <Box
          sx={{
            border: 2,
            borderColor: scopeColor,
            borderRadius: 2,
            p: 1,
            bgcolor: `${scopeColor}0d`,
          }}
        >
          {children}
        </Box>
      ) : (
        children
      )}
    </Box>
  );
}
