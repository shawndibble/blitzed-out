import {
  Box,
  Chip,
  Container,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
} from '@mui/material';
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
  /** Scrolls the page to the target section — nothing to expand, sections are always open. */
  onNavigate: (id: string) => void;
  /** Sticky offset for the desktop rail (page header height). */
  railTop?: number;
}

const SCOPE_ORDER: SettingsScope[] = ['room', 'board', 'me'];
const SCOPE_GROUP_KEYS: Record<SettingsScope, string> = {
  room: 'scopeRoomGroup',
  board: 'scopeBoardGroup',
  me: 'scopeMeGroup',
};

/**
 * Section navigation for the single-page settings: a scope-grouped rail
 * (desktop) or a horizontal chip row (mobile), both scroll-spied against the
 * one scrolling page — the active section highlights as it comes into view,
 * not just on tap.
 */
// The rail only ever renders on desktop (mobile gets the chip row instead),
// so this matches desktop's header height alone — no mobile chip row to add.
export default function JumpNav({ entries, onNavigate, railTop = 72 }: JumpNavProps): JSX.Element {
  const { t } = useTranslation();
  const isMobile = useBreakpoint();
  const [activeId, setActiveId] = useState<string>(entries[0]?.id ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -60% 0px' }
    );

    entries.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // The last section may never climb into the observer band; when the page
    // is scrolled to the bottom, it is the active one by definition.
    const onScroll = (): void => {
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
      if (scrolledToBottom && entries.length > 0) {
        setActiveId(entries[entries.length - 1].id);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [entries]);

  // The mobile chip row scrolls horizontally; when scroll-spy (or a tap)
  // changes the active chip, keep it in view instead of leaving it scrolled
  // off to one side.
  useEffect(() => {
    if (!isMobile) return;
    document
      .querySelector(`[data-jump-chip="${activeId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activeId, isMobile]);

  const navigate = (id: string): void => {
    setActiveId(id);
    onNavigate(id);
  };

  if (isMobile) {
    return (
      <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Container
          maxWidth="lg"
          sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', py: 1, scrollbarWidth: 'none' }}
        >
          {entries.map(({ id, labelKey, scope }) => (
            <Chip
              key={id}
              data-jump-chip={id}
              label={t(labelKey)}
              size="small"
              onClick={() => navigate(id)}
              variant={activeId === id ? 'filled' : 'outlined'}
              sx={{ flexShrink: 0 }}
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
        </Container>
      </Box>
    );
  }

  return (
    <List
      dense
      component="nav"
      sx={{
        position: 'sticky',
        top: railTop,
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
