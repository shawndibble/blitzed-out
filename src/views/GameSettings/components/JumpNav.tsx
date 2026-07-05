import { Box, Chip, List, ListItemButton, ListItemText, ListSubheader } from '@mui/material';
import { JSX, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useBreakpoint from '@/hooks/useBreakpoint';
import { SCOPE_COLORS, SettingsScope } from './scopeColors';

export interface JumpNavEntry {
  id: string;
  labelKey: string;
  scope: SettingsScope;
}

interface JumpNavProps {
  entries: JumpNavEntry[];
  /** Mobile chips must expand a collapsed section before scrolling to it. */
  onNavigate: (id: string) => void;
}

const SCOPE_ORDER: SettingsScope[] = ['room', 'board', 'me'];
const SCOPE_GROUP_KEYS: Record<SettingsScope, string> = {
  room: 'scopeRoomGroup',
  board: 'scopeBoardGroup',
  me: 'scopeMeGroup',
};

/**
 * Section navigation for the single-page settings: a sticky scope-grouped
 * rail with scroll-spy on desktop, a sticky horizontal chip row on mobile.
 * Both jump within the one scrolling page — no pane switching.
 */
export default function JumpNav({ entries, onNavigate }: JumpNavProps): JSX.Element {
  const { t } = useTranslation();
  const isMobile = useBreakpoint();
  const [activeId, setActiveId] = useState<string>(entries[0]?.id ?? '');

  useEffect(() => {
    if (isMobile) return;

    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );

    entries.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [entries, isMobile]);

  const navigate = (id: string): void => {
    setActiveId(id);
    onNavigate(id);
  };

  if (isMobile) {
    return (
      <Box
        sx={{
          position: 'sticky',
          top: 48,
          zIndex: 2,
          display: 'flex',
          gap: 0.75,
          overflowX: 'auto',
          py: 1,
          px: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          scrollbarWidth: 'none',
        }}
      >
        {entries.map(({ id, labelKey, scope }) => (
          <Chip
            key={id}
            label={t(labelKey)}
            size="small"
            onClick={() => navigate(id)}
            variant={activeId === id ? 'filled' : 'outlined'}
            sx={{
              flexShrink: 0,
              '& .MuiChip-label': { display: 'flex', alignItems: 'center', gap: 0.75 },
            }}
            icon={
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: SCOPE_COLORS[scope],
                  ml: 1,
                }}
              />
            }
          />
        ))}
      </Box>
    );
  }

  return (
    <List
      dense
      component="nav"
      sx={{
        position: 'sticky',
        top: 56,
        alignSelf: 'flex-start',
        minWidth: 190,
        pr: 1,
      }}
    >
      {SCOPE_ORDER.map((scope) => {
        const scopeEntries = entries.filter((entry) => entry.scope === scope);
        if (!scopeEntries.length) return null;
        return (
          <Box key={scope}>
            <ListSubheader
              disableSticky
              sx={{
                color: SCOPE_COLORS[scope],
                bgcolor: 'transparent',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                lineHeight: 2.5,
              }}
            >
              ● {t(SCOPE_GROUP_KEYS[scope])}
            </ListSubheader>
            {scopeEntries.map(({ id, labelKey }) => (
              <ListItemButton
                key={id}
                selected={activeId === id}
                onClick={() => navigate(id)}
                sx={{ borderRadius: 1, py: 0.5 }}
              >
                <ListItemText primary={t(labelKey)} slotProps={{ primary: { variant: 'body2' } }} />
              </ListItemButton>
            ))}
          </Box>
        );
      })}
    </List>
  );
}
