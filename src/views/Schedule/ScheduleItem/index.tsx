import { Button, Grid, Typography, Box, Chip, useTheme, alpha } from '@mui/material';
import { getSiteName } from '@/helpers/urls';
import EventIcon from '@mui/icons-material/Event';
import LinkIcon from '@mui/icons-material/Link';
import VideocamIcon from '@mui/icons-material/Videocam';
import AddToCalendarButton from '@/components/AddToCalendarButton';
import { downloadCalendarEvent } from '@/components/AddToCalendarButton/icsGenerator';
import { useTranslation } from 'react-i18next';

const getSiteButton = (url: string) => {
  try {
    const { href } = new URL(url);
    const name = getSiteName(url);

    return (
      <Button 
        href={href} 
        target="_blank" 
        rel="noreferrer"
        variant="outlined"
        size="small"
        startIcon={url.includes('meet') || url.includes('zoom') ? <VideocamIcon /> : <LinkIcon />}
      >
        {name}
      </Button>
    );
  } catch {
    return null;
  }
};

interface Game {
  id?: string;
  dateTime: {
    toDate: () => Date;
  };
  url: string;
}

interface ScheduleItemProps {
  game: Game;
}

export default function ScheduleItem({ game }: ScheduleItemProps): JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const date = game.dateTime.toDate();
  const isToday = new Date().toDateString() === date.toDateString();
  
  // Calculate if the game is upcoming (within the next 24 hours)
  const isUpcoming = date.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 && date > new Date();

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid size={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon 
            fontSize="small" 
            color={isToday ? "secondary" : "action"} 
            sx={{ opacity: isToday ? 1 : 0.7 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2" fontWeight={isToday ? "bold" : "normal"}>
              {date.toLocaleString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
            >
              {date.toLocaleString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Typography>
          </Box>
          
          {isUpcoming && (
            <Chip 
              label={t('soon')} 
              size="small" 
              color="primary" 
              sx={{ 
                height: 20, 
                fontSize: '0.7rem',
                ml: 1,
                borderRadius: 1,
                fontWeight: 'bold',
                backgroundColor: alpha(theme.palette.success.main, 0.8)
              }} 
            />
          )}
        </Box>
      </Grid>
      
      <Grid size={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {game.url ? (
            getSiteButton(game.url)
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
              {t('noLinkProvided')}
            </Typography>
          )}
          
          <AddToCalendarButton
            title={t('calendar.gameTitle')}
            date={date}
            url={game.url}
            downloadIcs={downloadCalendarEvent}
            buttonSx={{ ml: 1 }}
          />
        </Box>
      </Grid>
    </Grid>
  );
}
