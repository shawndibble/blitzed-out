import { Box, Card, Divider, Stack, Typography } from '@mui/material';
import { JSX, ReactNode } from 'react';

interface SettingGroupProps {
  children: ReactNode;
}

/** A card of related setting rows, divided hairlines between rows. */
export function SettingGroup({ children }: SettingGroupProps): JSX.Element {
  return (
    <Card variant="outlined">
      <Stack divider={<Divider />}>{children}</Stack>
    </Card>
  );
}

interface SettingRowProps {
  label: ReactNode;
  /** One-line consequence or clarification under the label. */
  description?: ReactNode;
  /** The control, rendered on the right. */
  children?: ReactNode;
}

/**
 * One setting: label (+ optional description) on the left, control on the
 * right. The uniform row anatomy of the whole settings page.
 */
export function SettingRow({ label, description, children }: SettingRowProps): JSX.Element {
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
