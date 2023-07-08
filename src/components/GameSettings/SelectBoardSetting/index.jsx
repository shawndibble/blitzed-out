import {
  FormControl, InputLabel, MenuItem, Select, Tooltip,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import { camelToPascal } from 'helpers/strings';
import './styles.css';

export default function SelectBoardSetting({
  option, settings, setSettings, dataFolder,
}) {
  const labelId = `${option}label`;
  const label = camelToPascal(option);
  const isDualSelect = ['alcohol', 'poppers'].includes(option);

  function getOptions(category) {
    return Object.keys(dataFolder[category]).map((optionVal, index) => (
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
            <>
              <Typography variant="subtitle2">Standalone = Its own tile. </Typography>
              <Typography variant="subtitle2">Append Some = Add to 50% of the tiles.</Typography>
              <Typography variant="subtitle2">Append Most = Add to 90% of the tiles.</Typography>
            </>
          )}
          arrow
        >
          <FormControl fullWidth margin="normal" sx={{ ml: 1 }}>
            <InputLabel id={`${labelId}Variation`}>{`${label} Variation`}</InputLabel>
            <Select
              labelId={`${labelId}Variation`}
              id={`${option}Variation`}
              label={`${label} Variation`}
              value={settings[`${option}Variation`] || 'standalone'}
              onChange={(event) => handleChange(event, `${option}Variation`)}
            >
              <MenuItem value="standalone">Standalone Tile</MenuItem>
              <MenuItem value="appendSome">Append Some Tiles</MenuItem>
              <MenuItem value="appendMost">Append Most Tiles</MenuItem>
            </Select>
          </FormControl>
        </Tooltip>
      )}
    </div>
  );
}
