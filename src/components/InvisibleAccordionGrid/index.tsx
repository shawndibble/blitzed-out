import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Grid2, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface InvisibleAccordionGridProps {
  children: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  defaultExpanded?: boolean;
  [key: string]: any;
}

export default function InvisibleAccordionGrid({
  children,
  title,
  subtitle,
  defaultExpanded = false,
  ...rest
}: InvisibleAccordionGridProps): JSX.Element {
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
        <Typography variant="h6" sx={{ width: '33%' }}>
          {title}:
        </Typography>
        <Typography sx={{ pt: 0.5 }}>{subtitle}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0 }}>
        <Grid2 container columnSpacing={2} justifyContent="space-evenly" className="columned-grid">
          {children}
        </Grid2>
      </AccordionDetails>
    </Accordion>
  );
}
