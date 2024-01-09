import {
  Button, List, ListItem, Typography,
} from '@mui/material';
import { Trans } from 'react-i18next';

const getSiteButton = (url) => {
  const name = new URL(url).hostname
    .replace('www.', '')
    .replace('.com', '')
    .replace('.net', '')
    .replace('.gg', '');

  return <Button href={url} target="_blank" rel="noreferrer">{name}</Button>;
};

export default function ScheduleList({ schedule }) {
  return (
    <>
      <Typography variant="body1"><Trans i18nKey="upcomingGames" /></Typography>
      <List>
        {schedule?.map((game) => (
          <ListItem
            key={game.dateTime}
            secondaryAction={
              !!game.url && getSiteButton(game.url)
            }
          >
            <Typography variant="body2">
              {new Date(game.dateTime).toLocaleString([], {
                year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}

            </Typography>
          </ListItem>
        ))}
      </List>
    </>
  );
}
