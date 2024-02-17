import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Grid, Typography } from '@mui/material';

export default function InvisibleAccordionGrid({ children, title, subtitle, ...rest })
{
  return (
    <Accordion
      defaultExpanded
      {...rest}
      sx={{ backgroundColor: 'inherit', backgroundImage: 'none', boxShadow: 'none' }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
      >
        <Typography variant='h6' sx={{ width: '33%' }}>{title}:</Typography>
        <Typography sx={{ pt: 0.5}}>{subtitle}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0 }}>
        <Grid container columnSpacing={2} justifyContent='center' className="columned-grid">
          {children}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}