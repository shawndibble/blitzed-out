import { Help } from '@mui/icons-material';
import {
  Stack, Switch, Tooltip, Typography,
} from '@mui/material';
import { Trans } from 'react-i18next';
import SelectBoardSetting from './SelectBoardSetting';
import FinishSlider from './FinishSlider';

export default function BoardSettings({ formData, setFormData, actionsList }) {
  const settingSelectLists = Object.keys(actionsList).map((option) => (
    <SelectBoardSetting
      key={option}
      option={option}
      settings={formData}
      setSettings={setFormData}
      actionsFolder={actionsList}
    />
  ));

  return (
    <>
      {!!formData.room && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="center"
          sx={{ mt: 1 }}
        >
          <Typography><Trans i18nKey="solo" /></Typography>
          <Tooltip
            title={<Typography variant="subtitle2"><Trans i18nKey="soloTooltip" /></Typography>}
            arrow
          >
            <Help sx={{ fontSize: 15 }} />
          </Tooltip>
          <Switch
            id="gameMode"
            checked={formData.gameMode === 'local'}
            onChange={(event) => setFormData({
              ...formData, gameMode: event.target.checked ? 'local' : 'online',
            })}
            inputProps={{ 'aria-label': 'Game Type' }}
          />
          <Typography>
            <Trans i18nKey="local" />
          </Typography>
          <Tooltip
            title={<Typography variant="subtitle2"><Trans i18nKey="localTooltip" /></Typography>}
            arrow
          >
            <Help sx={{ fontSize: 15 }} />
          </Tooltip>
        </Stack>
      )}
      {settingSelectLists}
      <FinishSlider setFormData={setFormData} formData={formData} />
    </>
  );
}
