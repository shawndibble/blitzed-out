import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  Typography,
  Box,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ReactNode } from 'react';

interface InvisibleAccordionGridProps {
  children: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  defaultExpanded?: boolean;
  hasSelectedOptions?: boolean; // Whether to show blue dot indicator
  [key: string]: any;
}

export default function InvisibleAccordionGrid({
  children,
  title,
  subtitle,
  defaultExpanded = false,
  hasSelectedOptions = false,
  ...rest
}: InvisibleAccordionGridProps): JSX.Element {
  const theme = useTheme();
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      {...rest}
      sx={{
        backgroundColor: 'inherit',
        backgroundImage: 'none',
        boxShadow: 'none',
      }}
    >
      <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography
            variant="h6"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}
          >
            {title}:
            {hasSelectedOptions && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  flexShrink: 0,
                }}
              />
            )}
          </Typography>
          <Typography sx={{ pt: 0.5, ml: 2, flex: 1 }}>{subtitle}</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0 }}>
        <Grid container columnSpacing={2} justifyContent="space-evenly" className="columned-grid">
          {children}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}
