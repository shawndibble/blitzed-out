import { Help } from '@mui/icons-material';
import {
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack, Switch, Tooltip, Typography,
} from '@mui/material';
import { Trans } from 'react-i18next';
import FinishSlider from './FinishSlider';
import SelectBoardSetting from './SelectBoardSetting';

export default function BoardSettings({ formData, setFormData, actionsList }) {
  const { alcohol, poppers, ...remainingActions } = actionsList;

  const settingSelectLists = Object.keys(remainingActions).map((option) => (
    <Grid item xs={12} sm={6} md={4} key={option}>
      <SelectBoardSetting
        option={option}
        settings={formData}
        setSettings={setFormData}
        actionsFolder={remainingActions}
      />
    </Grid>
  ));

  return (
    <>
      <Grid container columnSpacing={2} justifyContent="center">
        <Grid item xs={12} sm={8} md={5}>
          <SelectBoardSetting
            option="alcohol"
            settings={formData}
            setSettings={setFormData}
            actionsFolder={actionsList}
          />
        </Grid>
        <Divider orientation="vertical" />
        <Grid item xs={12} sm={8} md={5}>
          <SelectBoardSetting
            option="poppers"
            settings={formData}
            setSettings={setFormData}
            actionsFolder={actionsList}
          />
        </Grid>
      </Grid>
      {formData.room !== 'public' && (
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
              ...formData,
              gameMode: event.target.checked ? 'local' : 'online',
              boardUpdated: true,
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
      <Grid container columnSpacing={2}>{settingSelectLists}</Grid>
      <Divider />
      <FormControl fullWidth margin="normal">
        <InputLabel id="difficultyLabel"><Trans i18nKey="difficulty" /></InputLabel>
        <Select
          labelId="difficultyLabel"
          id="difficulty"
          label={<Trans i18nKey="difficulty" />}
          value={formData.difficulty || 'normal'}
          onChange={(event) => setFormData({
            ...formData, difficulty: event.target.value, boardUpdated: true,
          })}
        >
          <MenuItem value="normal"><Trans i18nKey="normal" /></MenuItem>
          <MenuItem value="accelerated"><Trans i18nKey="accelerated" /></MenuItem>
        </Select>
      </FormControl>
      <FinishSlider setFormData={setFormData} formData={formData} />
    </>
  );
}
