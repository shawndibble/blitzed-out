import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from '@mui/material';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import CloseIcon from '@/components/CloseIcon';
import ToastAlert from '@/components/ToastAlert';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import useSchedule from '@/context/hooks/useSchedule';
import ScheduleItem from './ScheduleItem';

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
      }

      addToSchedule(dateTime, url);
    },
    [schedule]
  );

  return (
    <>
      <Dialog fullScreen={isMobile} open={open} onClose={close} maxWidth="md">
        <form onSubmit={scheduleEvent}>
          <DialogTitle>
            <Trans i18nKey="schedule" />
            <CloseIcon close={close} />
          </DialogTitle>
          <DialogContent>
            <Box>
              {schedule.length ? (
                schedule?.map((game) => <ScheduleItem key={game.id} game={game} />)
              ) : (
                <Typography variant="body1">No Planned Games</Typography>
              )}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="body1">
                <Trans i18nKey="scheduleGame" />
              </Typography>
            </Box>
            <Box sx={{ my: 2 }}>
              <DateTimePicker
                name="date-time"
                label={t('dateTime')}
                closeOnSelect={false}
                disablePast
                maxDate={twoWeeksFromNow}
                timeSteps={{ minutes: 30 }}
                sx={{ width: '100%' }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField label={t('camUrl')} variant="outlined" name="link" fullWidth />
            </Box>

            <Button variant="contained" type="submit" fullWidth>
              <Trans i18nKey="schedule" />
            </Button>
          </DialogContent>
        </form>
      </Dialog>
      <ToastAlert open={!!alert} close={handleCloseAlert}>
        {alert}
      </ToastAlert>
    </>
  );
}
