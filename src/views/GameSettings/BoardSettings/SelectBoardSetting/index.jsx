import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import { Trans, useTranslation } from 'react-i18next';
import { Help } from '@mui/icons-material';
import SettingsSelect from 'components/SettingsSelect';

export default function SelectBoardSetting({
  option,
  settings,
  setSettings,
  actionsFolder,
  showVariation = false,
  showRole = false,
}) {
  const { t } = useTranslation();
  const labelId = `${option}label`;
  const label = actionsFolder[option]?.label;

  function getOptions(category) {
    return Object.keys(actionsFolder[category]?.actions).map(
      (optionVal, index) => (
        <MenuItem value={index} key={`${category}-${optionVal}`}>
          {optionVal}
        </MenuItem>
      )
    );
  }

  function handleChange(event, key) {
    setSettings({ ...settings, [key]: event.target.value, boardUpdated: true });
  }

  let gridSize = 12;
  if (showVariation) gridSize = 6;
  if (showRole) gridSize = 6;

  return (
    <Grid container key={option} justifyContent='center'>
      <Grid item xs={gridSize}>
        <FormControl fullWidth margin='normal'>
          <InputLabel id={labelId}>{label}</InputLabel>
          <Select
            labelId={labelId}
            id={option}
            label={label}
            value={settings[option] || 0}
            onChange={(event) => handleChange(event, option)}
          >
            {getOptions(option)}
          </Select>
        </FormControl>
      </Grid>
      {!!showRole && (
        <Grid item xs={6}>
          <SettingsSelect
            sx={{ ml: 1 }}
            value={settings[`${option}role`]}
            onChange={(event) => handleChange(event, `${option}role`)}
            label={`${t('role')}: ${label}`}
            options={['sub', 'vers', 'dom']}
            defaultValue={settings.role || 'sub'}
          />
        </Grid>
      )}
      {!!showVariation && (
        <Grid item xs={6}>
          <Tooltip
            placement='top'
            title={
              <Trans i18nKey='variationTooltip'>
                <Typography variant='subtitle2'>
                  Standalone = Its own tile.{' '}
                </Typography>
                <Typography variant='subtitle2'>
                  Append Some = 50% chance.
                </Typography>
                <Typography variant='subtitle2'>
                  Append Most = 90% chance.
                </Typography>
              </Trans>
            }
            arrow
          >
            <FormControl fullWidth margin='normal' sx={{ ml: 1 }}>
              <InputLabel id={`${labelId}Variation`}>
                {`${label} ${t('variation')}`}
                <Help sx={{ ml: 1, fontSize: 16 }} />
              </InputLabel>
              <Select
                labelId={`${labelId}Variation`}
                id={`${option}Variation`}
                label={
                  <>
                    {label} {t('variation')}
                    <Help sx={{ ml: 1, fontSize: 16 }} />
                  </>
                }
                value={settings[`${option}Variation`] || 'standalone'}
                onChange={(event) => handleChange(event, `${option}Variation`)}
              >
                <MenuItem value='standalone'>
                  <Trans i18nKey='standalone' />
                </MenuItem>
                <MenuItem value='appendSome'>
                  <Trans i18nKey='appendSome' />
                </MenuItem>
                <MenuItem value='appendMost'>
                  <Trans i18nKey='appendMost' />
                </MenuItem>
              </Select>
            </FormControl>
          </Tooltip>
        </Grid>
      )}
    </Grid>
  );
}
