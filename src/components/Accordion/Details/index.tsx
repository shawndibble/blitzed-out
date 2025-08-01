import { styled } from '@mui/material/styles';
import MuiAccordionDetails, { AccordionDetailsProps } from '@mui/material/AccordionDetails';

const AccordionDetails = styled(MuiAccordionDetails)<AccordionDetailsProps>(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

export default AccordionDetails;
