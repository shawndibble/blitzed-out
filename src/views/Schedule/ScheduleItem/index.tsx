import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import { getSiteName } from '@/helpers/urls';
import EventIcon from '@mui/icons-material/Event';
import LinkIcon from '@mui/icons-material/Link';
import VideocamIcon from '@mui/icons-material/Videocam';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddToCalendarButton from '@/components/AddToCalendarButton';
import { downloadCalendarEvent } from '@/components/AddToCalendarButton/icsGenerator';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

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
  createdBy?: string;
}

interface ScheduleItemProps {
  game: Game;
  currentUserId?: string;
  onUpdate?: (id: string, updates: { dateTime: Date; url: string }) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

export default function ScheduleItem({
  game,
  currentUserId,
  onUpdate,
  onDelete,
}: ScheduleItemProps): JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const date = game.dateTime.toDate();
  const isToday = new Date().toDateString() === date.toDateString();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editDateTime, setEditDateTime] = useState<Dayjs | null>(dayjs(date));
  const [editUrl, setEditUrl] = useState(game.url || '');

  const canManage = Boolean(game.id && currentUserId && game.createdBy === currentUserId);

  // Calculate if the game is upcoming (within the next 24 hours)
  const isUpcoming =
    date.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 && date > new Date();

  const handleCancelEdit = () => {
    setEditDateTime(dayjs(date));
    setEditUrl(game.url || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!game.id || !onUpdate) return;

    try {
      await onUpdate(game.id, {
        dateTime: editDateTime?.toDate() ?? new Date(NaN),
        url: editUrl,
      });
      setIsEditing(false);
    } catch {
      // Parent validation/error handling keeps the edit form open.
    }
  };

  const handleDelete = async () => {
    if (!game.id || !onDelete) return;

    await onDelete(game.id);
    setConfirmDeleteOpen(false);
  };

  if (isEditing) {
    return (
      <Grid
        container
        spacing={2}
        sx={{
          alignItems: 'center',
        }}
      >
        <Grid size={{ xs: 12, sm: 6 }}>
          <DateTimePicker
            label={t('dateTime')}
            value={editDateTime}
            onChange={(newValue) => setEditDateTime(newValue)}
            closeOnSelect={false}
            disablePast
            timeSteps={{ minutes: 30 }}
            sx={{ width: '100%' }}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
              },
              openPickerButton: {
                sx: {
                  color: theme.palette.text.primary,
                },
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('camUrl')}
            size="small"
            value={editUrl}
            onChange={(event) => setEditUrl(event.target.value)}
          />
        </Grid>
        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button size="small" onClick={handleCancelEdit}>
              {t('cancel')}
            </Button>
            <Button size="small" variant="contained" onClick={handleSave}>
              {t('save')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    );
  }

  return (
    <>
      <Grid
        container
        spacing={2}
        sx={{
          alignItems: 'center',
        }}
      >
        <Grid size={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon
              fontSize="small"
              color={isToday ? 'secondary' : 'action'}
              sx={{ opacity: isToday ? 1 : 0.7 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isToday ? 'bold' : 'normal',
                }}
              >
                {date.toLocaleString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
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
                  backgroundColor: alpha(theme.palette.success.main, 0.8),
                }}
              />
            )}

            {canManage && (
              <Box sx={{ display: 'flex', ml: 'auto', gap: 0.5 }}>
                <IconButton
                  size="small"
                  aria-label="edit scheduled game"
                  onClick={() => setIsEditing(true)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="delete scheduled game"
                  color="error"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {game.url ? (
              getSiteButton(game.url)
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                }}
              >
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
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>{t('delete')}</DialogTitle>
        <DialogContent>
          <Typography>{t('confirmDeleteScheduledGame', 'Delete this scheduled game?')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>{t('cancel')}</Button>
          <Button color="error" onClick={handleDelete}>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
