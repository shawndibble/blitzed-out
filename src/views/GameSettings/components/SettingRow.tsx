import { Box, Card, Divider, Stack, Typography } from '@mui/material';
import { JSX, ReactNode } from 'react';

interface SettingGroupProps {
  children: ReactNode;
  /**
   * Accent color for this card's own border, to mark it as load-bearing. Recolors
   * the existing outline rather than adding a second frame around it — a wrapper
   * would read as a card inside a card.
   */
  accent?: string;
}

/** A card of related setting rows, divided hairlines between rows. */
export function SettingGroup({ children, accent }: SettingGroupProps): JSX.Element {
  return (
    <Card
      variant="outlined"
      sx={accent ? { borderColor: accent, borderWidth: 2, bgcolor: `${accent}0d` } : undefined}
    >
      <Stack divider={<Divider />}>{children}</Stack>
    </Card>
  );
}

interface SettingRowProps {
  label: ReactNode;
  /**
   * One line under the label. For a row whose answer changes what happens, pass
   * a description that changes with the selection: stating the consequence of
   * the current answer explains the control better than a help popover listing
   * every option, and it needs no tap to read.
   */
  description?: ReactNode;
  /** The control, rendered on the right. */
  children?: ReactNode;
  /** Indents the row to read as a sub-question of the row above it. */
  nested?: boolean;
}

/**
 * One setting: label (+ optional description) on the left, control on the
 * right. The uniform row anatomy of the whole settings page.
 */
export function SettingRow({
  label,
  description,
  children,
  nested = false,
}: SettingRowProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
        px: 2,
        py: 1.5,
        ...(nested && {
          pl: 4,
          borderLeft: 2,
          borderLeftColor: 'divider',
          ml: 2,
        }),
      }}
    >
      <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
        <Typography variant="body2" component="div" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        {description && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {description}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0,
          justifyContent: 'flex-end',
          // Row controls stay compact like the approved design, regardless of
          // each control's MUI default sizing.
          '& .MuiToggleButton-root': { py: 0.4, px: 1.4, fontSize: '0.75rem' },
          '& .MuiButton-root': { py: 0.4, px: 1.4, fontSize: '0.78rem' },
          '& .MuiSelect-select': { py: 0.6, fontSize: '0.85rem' },
          '& .MuiInputBase-input': { py: 0.6, fontSize: '0.85rem' },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
