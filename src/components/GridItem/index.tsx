import { Grid } from '@mui/material';
import { ReactNode } from 'react';

interface GridItemProps {
  children: ReactNode;
}

export default function GridItem({ children }: GridItemProps): JSX.Element {
  return <Grid size={{ xs: 12, md: 5 }}>{children}</Grid>;
}
