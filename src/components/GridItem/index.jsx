import { Grid2 } from '@mui/material';

export default function GridItem({ children }) {
  return <Grid2 size={{ xs: 12, md: 5 }}>{children}</Grid2>;
}
