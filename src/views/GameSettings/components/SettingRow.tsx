import { Box, Card, Divider, IconButton, Popover, Stack, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import { JSX, MouseEvent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  /**
   * Long-form explanation of every option, behind a `?` next to the label.
   * The inline `description` states the current consequence and stays short;
   * this carries the detail that would otherwise make the row tall.
   */
  help?: ReactNode;
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
  help,
  children,
  nested = false,
}: SettingRowProps): JSX.Element {
  const { t } = useTranslation();
  const [helpAnchor, setHelpAnchor] = useState<HTMLElement | null>(null);

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
        <Typography
          variant="body2"
          component="div"
          sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          {label}
          {help && (
            <>
              <IconButton
                size="small"
                aria-label={t('setupHelpLabel')}
                onClick={(event: MouseEvent<HTMLElement>) => setHelpAnchor(event.currentTarget)}
              >
                <HelpOutlineIcon fontSize="inherit" />
              </IconButton>
              <Popover
                open={Boolean(helpAnchor)}
                anchorEl={helpAnchor}
                onClose={() => setHelpAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <Stack spacing={1} sx={{ p: 2, maxWidth: 340 }}>
                  {help}
                </Stack>
              </Popover>
            </>
          )}
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
