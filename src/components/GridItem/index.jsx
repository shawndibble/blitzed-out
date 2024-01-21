import { Grid } from '@mui/material';

export default function GridItem({ children }) {
  return (
    <Grid item xs={12} md={5}>
      {children}
    </Grid>
  );
}
