import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { JSX, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import useBreakpoint from '@/hooks/useBreakpoint';
import { SCOPE_COLORS, SettingsScope } from './scopeColors';

const SCOPE_LABEL_KEYS: Record<SettingsScope, string> = {
  room: 'scopeRoom',
  board: 'scopeBoard',
  me: 'scopeMe',
};

const SCOPE_HINT_KEYS: Record<SettingsScope, string> = {
  room: 'scopeRoomHint',
  board: 'scopeBoardHint',
  me: 'scopeMeHint',
};

interface SettingsSectionProps {
  id: string;
  scope: SettingsScope;
  title: string;
  /** Extra summary text next to the title (e.g. enabled count). */
  summary?: string;
  /** Optional control rendered on the section header (e.g. an Add button). */
  action?: ReactNode;
  expanded: boolean;
  onExpandedChange: (id: string, expanded: boolean) => void;
  children: ReactNode;
}

/**
 * One settings section. Desktop: a plain block in the single scrolling page.
 * Mobile: a collapsed accordion so the full catalog stays about a screen tall.
 */
export default function SettingsSection({
  id,
  scope,
  title,
  summary,
  action,
  expanded,
  onExpandedChange,
  children,
}: SettingsSectionProps): JSX.Element {
  const { t } = useTranslation();
  const isMobile = useBreakpoint();
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

  if (isMobile) {
    return (
      <Accordion
        id={id}
        expanded={expanded}
        onChange={(_, isExpanded) => onExpandedChange(id, isExpanded)}
        disableGutters
        sx={{ scrollMarginTop: 96, '&::before': { display: 'none' }, mb: 1, borderRadius: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {scopeChip}
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {summary && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {summary}
              </Typography>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          {action && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>{action}</Box>
          )}
          {children}
        </AccordionDetails>
      </Accordion>
    );
  }

  return (
    <Box id={id} component="section" sx={{ scrollMarginTop: 72, mb: 4 }}>
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
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t(SCOPE_HINT_KEYS[scope])}
          </Typography>
          {action}
        </Box>
      </Box>
      {children}
    </Box>
  );
}
