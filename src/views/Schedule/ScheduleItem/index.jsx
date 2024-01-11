import {
  Box,
  Button,
  Grid,
  Typography,
} from '@mui/material';

const getSiteButton = (url) => {
  try {
    const { href } = new URL(url);
    const name = new URL(url).hostname
      .replace('www.', '')
      .replace('.com', '')
      .replace('.net', '')
      .replace('.gg', '');

    return <Button href={href} target="_blank" rel="noreferrer">{name}</Button>;
  } catch (e) {
    return null;
  }
};

export default function ScheduleItem({ game }) {
  return (
    <Box sx={{ width: '100%' }} key={game.id}>
      <Grid container alignItems="center" spacing={1}>
        <Grid item xs={7}>
          <Typography variant="body2">
            {game.dateTime.toDate().toLocaleString([], {
              year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </Typography>
        </Grid>
        <Grid item xs={5}>
          {getSiteButton(game.url)}
        </Grid>
      </Grid>
    </Box>
  );
}
