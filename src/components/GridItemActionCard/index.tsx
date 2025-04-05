import { Card, CardActionArea, CardContent, Divider, Grid, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface GridItemActionCardProps {
  children: ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function GridItemActionCard({ 
  children, 
  title, 
  onClick, 
  disabled 
}: GridItemActionCardProps): JSX.Element {
  return (
    <Grid size={{ xs: 12, sm: 6 }} container>
      <Card sx={{ width: '100%' }}>
        <CardActionArea
          sx={{
            height: '100%',
            display: 'inline-flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          }}
          onClick={onClick}
          disabled={disabled}
        >
          <CardContent sx={{ width: '100%', color: disabled ? 'gray' : 'white' }}>
            <Typography variant="h5">{title}</Typography>
            <Divider sx={{ mb: 2 }} />
            {children}
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
}
