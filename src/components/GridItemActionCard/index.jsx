import { Card, CardActionArea, CardContent, Divider, Grid2, Typography } from '@mui/material';

export default function GridItemActionCard({ children, title, onClick, disabled }) {
  return (
    <Grid2 size={{ xs: 12, sm: 6 }} container>
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
    </Grid2>
  );
}
