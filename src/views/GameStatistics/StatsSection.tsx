import { Box, Grid, Typography, useTheme } from '@mui/material';
import { Trans } from 'react-i18next';
import { ReactNode } from 'react';

interface StatsSectionProps {
  titleKey: string;
  children: ReactNode;
  icon?: ReactNode;
  showDivider?: boolean;
}

export default function StatsSection({
  titleKey,
  children,
  icon,
  showDivider = true,
}: StatsSectionProps): JSX.Element {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        mb: 2,
        position: 'relative',
      }}
    >
      {showDivider && (
        <Box
          sx={{
            height: '1px',
            background: isDark
              ? 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.3), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(8, 145, 178, 0.3), transparent)',
            mb: 2,
          }}
        />
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
        }}
      >
        {icon && (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              background: isDark
                ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(8, 145, 178, 0.15) 0%, rgba(34, 211, 238, 0.08) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& svg': {
                fontSize: 18,
                color: theme.palette.primary.main,
              },
            }}
          >
            {icon}
          </Box>
        )}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '1rem',
            color: 'text.primary',
            letterSpacing: '0.01em',
          }}
        >
          <Trans i18nKey={titleKey as never} />
        </Typography>
      </Box>
      <Grid container spacing={1.5}>
        {children}
      </Grid>
    </Box>
  );
}
