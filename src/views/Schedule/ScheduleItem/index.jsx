import { Button, Grid, Typography } from '@mui/material';
import { getSiteName } from 'helpers/urls';

const getSiteButton = (url) => {
  try {
    const { href } = new URL(url);
    const name = getSiteName(url);

    return (
      <Button href={href} target="_blank" rel="noreferrer">
        {name}
      </Button>
    );
  } catch (e) {
    return null;
  }
};

export default function ScheduleItem({ game }) {
  return (
    <Grid container alignItems="center" spacing={1}>
      <Grid item sx={{ whiteSpace: 'nowrap' }}>
        <Typography variant="body2">
          {game.dateTime.toDate().toLocaleString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Typography>
      </Grid>
      <Grid item>{getSiteButton(game.url)}</Grid>
    </Grid>
  );
}
