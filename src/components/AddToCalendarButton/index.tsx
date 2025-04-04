import { useState } from 'react';
import { 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  alpha, 
  useTheme 
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';
import DownloadIcon from '@mui/icons-material/Download';
import MicrosoftIcon from '@mui/icons-material/Window';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface AddToCalendarButtonProps {
  title?: string;
  date: Date;
  url?: string;
  description?: string;
  location?: string;
  baseUrl?: string;
  downloadIcs: (title: string, date: Date, url?: string, description?: string) => void;
  buttonSx?: any;
}

export default function AddToCalendarButton({
  title,
  date,
  url,
  description = '',
  location = '',
  baseUrl = 'https://blitzedout.com/PUBLIC',
  downloadIcs,
  buttonSx = {}
}: AddToCalendarButtonProps): JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  
  // Calendar menu state
  const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
  const calendarMenuOpen = Boolean(calendarAnchorEl);
  
  const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCalendarAnchorEl(event.currentTarget);
  };
  
  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
  };
  
  // Get event title, using translation if no title provided
  const getEventTitle = () => {
    return title || t('calendar.gameTitle');
  };
  
  // Handle adding to calendar
  const handleAddToCalendar = () => {
    downloadIcs(getEventTitle(), date, url, getFullDescription());
    handleCalendarClose();
  };

  // Get full description with all details
  const getFullDescription = () => {
    let fullDescription = `${getEventTitle()}`;
    
    if (baseUrl) {
      fullDescription += `\n${baseUrl}`;
    }
    
    if (url) {
      fullDescription += `\n\n${t('calendar.videoLink')}: ${url}`;
    }
    
    if (description) {
      fullDescription += `\n\n${description}`;
    }
    
    return fullDescription;
  };
  
  // Create Google Calendar URL
  const getGoogleCalendarUrl = () => {
    const startTime = date.toISOString().replace(/-|:|\.\d+/g, '');
    // End time is 1 hour after start
    const endTime = new Date(date.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');
    
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: getEventTitle(),
      dates: `${startTime}/${endTime}`,
      details: getFullDescription(),
    });
    
    if (location || url) {
      params.append('location', location || url || '');
    }
    
    return `${baseUrl}?${params.toString()}`;
  };
  
  // Create Outlook Calendar URL
  const getOutlookCalendarUrl = () => {
    const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: getEventTitle(),
      startdt: date.toISOString(),
      enddt: new Date(date.getTime() + 60 * 60 * 1000).toISOString(),
      body: getFullDescription(),
    });
    
    if (location || url) {
      params.append('location', location || url || '');
    }
    
    return `${baseUrl}?${params.toString()}`;
  };
  
  // Create Yahoo Calendar URL
  const getYahooCalendarUrl = () => {
    const startTime = Math.floor(date.getTime() / 1000);
    const endTime = Math.floor((date.getTime() + 60 * 60 * 1000) / 1000);
    
    const baseUrl = 'https://calendar.yahoo.com/';
    const params = new URLSearchParams({
      v: '60',
      title: getEventTitle(),
      st: startTime.toString(),
      et: endTime.toString(),
      desc: getFullDescription(),
    });
    
    if (location || url) {
      params.append('in_loc', location || url || '');
    }
    
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<CalendarMonthIcon fontSize="small" />}
        onClick={handleCalendarClick}
        aria-controls={calendarMenuOpen ? 'calendar-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={calendarMenuOpen ? 'true' : undefined}
        sx={{
          borderColor: alpha(theme.palette.secondary.main, 0.3),
          color: theme.palette.secondary.main,
          '&:hover': {
            borderColor: theme.palette.secondary.main,
            backgroundColor: alpha(theme.palette.secondary.main, 0.05),
          },
          ...buttonSx
        }}
      >
        {t('calendar.addToCalendar')}
      </Button>
      
      <Menu
        id="calendar-menu"
        anchorEl={calendarAnchorEl}
        open={calendarMenuOpen}
        onClose={handleCalendarClose}
        MenuListProps={{
          'aria-labelledby': 'calendar-button',
          dense: true,
        }}
      >
        <MenuItem onClick={handleAddToCalendar}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.downloadIcs')}</ListItemText>
        </MenuItem>
        
        <MenuItem 
          component="a"
          href={getGoogleCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCalendarClose}
        >
          <ListItemIcon>
            <GoogleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.googleCalendar')}</ListItemText>
        </MenuItem>
        
        <MenuItem 
          component="a"
          href={getOutlookCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCalendarClose}
        >
          <ListItemIcon>
            <MicrosoftIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.outlookCalendar')}</ListItemText>
        </MenuItem>
        
        <MenuItem 
          component="a"
          href={getYahooCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCalendarClose}
        >
          <ListItemIcon>
            <MoreVertIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.yahooCalendar')}</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleAddToCalendar}>
          <ListItemIcon>
            <AppleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.appleCalendar')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
