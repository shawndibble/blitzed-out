import {
  FormControl, InputLabel, MenuItem, Select, Tooltip,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import './styles.css';
import { Trans, useTranslation } from 'react-i18next';
import { Help } from '@mui/icons-material';

export default function SelectBoardSetting({
  option, settings, setSettings, dataFolder,
}) {
  const { t } = useTranslation();
  const labelId = `${option}label`;
  const label = dataFolder[option]?.label;
  const isDualSelect = ['alcohol', 'poppers'].includes(option);

  function getOptions(category) {
    return Object.keys(dataFolder[category]?.actions).map((optionVal, index) => (
      <MenuItem value={index} key={`${category}-${optionVal}`}>{optionVal}</MenuItem>
    ));
  }

  function handleChange(event, key) {
    setSettings({ ...settings, [key]: event.target.value, boardUpdated: true });
  }

  return (
    <div key={option} className={isDualSelect ? 'dualWidth' : ''}>
      <FormControl fullWidth margin="normal">
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
      {!!isDualSelect && (
        <Tooltip
          placement="top"
          title={(
            <Trans i18nKey="variationTooltip">
              <Typography variant="subtitle2">Standalone = Its own tile. </Typography>
              <Typography variant="subtitle2">Append Some = Add to 50% of the tiles.</Typography>
              <Typography variant="subtitle2">Append Most = Add to 90% of the tiles.</Typography>
            </Trans>
          )}
          arrow
        >
          <FormControl fullWidth margin="normal" sx={{ ml: 1 }}>
            <InputLabel id={`${labelId}Variation`}>
              {`${label} ${t('variation')}`}
              <Help sx={{ ml: 1, fontSize: 16 }} />
            </InputLabel>
            <Select
              labelId={`${labelId}Variation`}
              id={`${option}Variation`}
              label={(
                <>
                  {label}
                  {' '}
                  {t('variation')}
                  <Help sx={{ ml: 1, fontSize: 16 }} />
                </>
              )}
              value={settings[`${option}Variation`] || 'standalone'}
              onChange={(event) => handleChange(event, `${option}Variation`)}
            >
              <MenuItem value="standalone"><Trans i18nKey="standalone" /></MenuItem>
              <MenuItem value="appendSome"><Trans i18nKey="appendSome" /></MenuItem>
              <MenuItem value="appendMost"><Trans i18nKey="appendMost" /></MenuItem>
            </Select>
          </FormControl>
        </Tooltip>
      )}
    </div>
  );
}
