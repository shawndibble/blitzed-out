import { Help } from '@mui/icons-material';
import { Stack, Switch, Tooltip, Typography } from '@mui/material';
import { isOnlineMode } from 'helpers/strings';
import { Trans } from 'react-i18next';

export default function SoloSwitch({ formData, setFormData }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
      <Typography>
        <Trans i18nKey="solo" />
      </Typography>
      <Tooltip
        title={
          <Typography variant="subtitle2">
            <Trans i18nKey="soloTooltip" />
          </Typography>
        }
        arrow
      >
        <Help sx={{ fontSize: 15 }} />
      </Tooltip>
      <Switch
        id="gameMode"
        checked={!isOnlineMode(formData.gameMode)}
        onChange={(event) =>
          setFormData({
            ...formData,
            gameMode: event.target.checked ? 'local' : 'online',
            boardUpdated: true,
          })
        }
        inputProps={{ 'aria-label': 'Game Type' }}
      />
      <Typography>
        <Trans i18nKey="local" />
      </Typography>
      <Tooltip
        title={
          <Typography variant="subtitle2">
            <Trans i18nKey="localTooltip" />
          </Typography>
        }
        arrow
      >
        <Help sx={{ fontSize: 15 }} />
      </Tooltip>
    </Stack>
  );
}
