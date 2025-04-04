import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Paper,
  Stack,
  Card,
  CardContent,
  CardHeader,
  useTheme,
  alpha,
} from '@mui/material';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import CloseIcon from '@/components/CloseIcon';
import ToastAlert from '@/components/ToastAlert';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import useSchedule from '@/context/hooks/useSchedule';
import ScheduleItem from './ScheduleItem';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';

interface ScheduleProps {
  open: boolean;
  close: () => void;
  isMobile: boolean;
}

export default function Schedule({ open, close, isMobile }: ScheduleProps): JSX.Element {
  const { t } = useTranslation();
  const [alert, setAlert] = useState<string | null>('');
  const { schedule, addToSchedule } = useSchedule();
  const twoWeeksFromNow = dayjs().add(2, 'week');
  const theme = useTheme();

  const handleCloseAlert = useCallback(() => {
    setAlert(null);
  }, []);

  const scheduleEvent = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formElements = event.currentTarget as HTMLFormElement;
      const dateTimeInput = formElements.elements.namedItem('date-time') as HTMLInputElement;
      const dateTime = new Date(dateTimeInput.value);
      const urlInput = formElements.elements.namedItem('link') as HTMLInputElement;
      const url = urlInput.value;

      if (!dateTime || !(dateTime instanceof Date)) {
        setAlert('Please select a date and time');
        return;
      }

      if (dateTime < dayjs().toDate()) {
        setAlert('Please select a date and time in the future');
        return;
      }

      if (schedule.find((s) => s.dateTime.toDate().toUTCString() === dateTime.toUTCString())) {
        setAlert('A game is already scheduled for this date and time');
        return;
      }

      if (dateTime > twoWeeksFromNow.toDate()) {
        setAlert('Please select a date and time within the next two weeks');
        return;
      }

      if (url && !url.startsWith('http')) {
        setAlert('Please enter a valid URL');
        return;
      }

      addToSchedule(dateTime, url);
      
      // Reset form fields
      formElements.reset();
    },
    [schedule, addToSchedule, twoWeeksFromNow]
  );

  return (
    <>
      <Dialog 
        fullScreen={isMobile} 
        open={open} 
        onClose={close} 
        maxWidth="md"
      >
        <form onSubmit={scheduleEvent}>
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
          }}>
            <CalendarMonthIcon color="primary" />
            <Typography variant="h5" component="span" fontWeight="bold">
              <Trans i18nKey="schedule" />
            </Typography>
            <CloseIcon close={close} />
          </DialogTitle>
          <DialogContent>
            <Card 
              elevation={3} 
              sx={{ 
                mb: 4, 
                background: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 2,
                overflow: 'visible',
                position: 'relative',
              }}
            >
              <CardHeader 
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      Planned Games
                    </Typography>
                  </Box>
                }
                sx={{ 
                  pb: 1,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              />
              <CardContent sx={{ p: 2 }}>
                {schedule.length ? (
                  <Stack spacing={2}>
                    {schedule?.map((game) => (
                      <Paper 
                        key={game.id} 
                        elevation={1} 
                        sx={{ p: 1.5, borderRadius: 1.5 }}
                      >
                        <ScheduleItem game={game} />
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    color: alpha(theme.palette.text.primary, 0.6),
                    borderRadius: 1,
                    background: alpha(theme.palette.background.paper, 0.5),
                  }}>
                    <Typography variant="body1">No Planned Games</Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontSize: '0.85rem' }}>
                      Use the form below to schedule your first game
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card 
              elevation={2} 
              sx={{ 
                background: alpha(theme.palette.background.paper, 0.7),
                borderRadius: 2,
              }}
            >
              <CardHeader 
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon color="secondary" />
                    <Typography variant="h6" fontWeight="bold">
                      <Trans i18nKey="scheduleGame" />
                    </Typography>
                  </Box>
                }
                sx={{ 
                  pb: 1,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              />
              <CardContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                  <DateTimePicker
                    name="date-time"
                    label={t('dateTime')}
                    closeOnSelect={false}
                    disablePast
                    maxDate={twoWeeksFromNow}
                    timeSteps={{ minutes: 30 }}
                    sx={{ width: '100%' }}
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        fullWidth: true,
                      }
                    }}
                  />
                  
                  <TextField 
                    label={t('camUrl')} 
                    variant="outlined" 
                    name="link" 
                    fullWidth 
                    placeholder="https://..."
                    helperText="Optional: Link to your stream or meeting"
                  />
                  
                  <Button 
                    variant="contained" 
                    type="submit" 
                    fullWidth
                    size="large"
                    startIcon={<EventIcon />}
                    sx={{ 
                      mt: 2,
                      py: 1.2,
                      borderRadius: 1.5,
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: theme.shadows[4],
                      '&:hover': {
                        boxShadow: theme.shadows[8],
                      }
                    }}
                  >
                    <Trans i18nKey="schedule" />
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </DialogContent>
        </form>
      </Dialog>
      <ToastAlert open={!!alert} close={handleCloseAlert}>
        {alert}
      </ToastAlert>
    </>
  );
}
