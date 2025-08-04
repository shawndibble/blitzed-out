import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface MultiSelectIntensityProps {
  actionName: string;
  actionLabel: string;
  selectedLevels: number[];
  availableLevels: number[];
  intensityNames?: Record<number, string>; // Map level numbers to their display names
  onChange: (levels: number[]) => void;
  disabled?: boolean;
}

export default function MultiSelectIntensity({
  actionName,
  actionLabel,
  selectedLevels,
  availableLevels,
  intensityNames = {},
  onChange,
  disabled = false,
}: MultiSelectIntensityProps): JSX.Element {
  const { t } = useTranslation();

  const labelId = `${actionName}-intensity-label`;

  const handleChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    // value should always be an array when multiple={true}
    const levels = (value as number[]).filter((n) => !isNaN(n)).sort((a, b) => a - b);

    onChange(levels);
  };

  // Custom render function to display selected intensity level names
  const renderValue = (selected: number[]) => {
    if (selected.length === 0) {
      return t('none');
    }
    return selected.map((level) => intensityNames[level] || `${t('level')} ${level}`).join(', ');
  };

  if (availableLevels.length === 0) {
    return <></>;
  }

  return (
    <FormControl margin="normal" fullWidth disabled={disabled}>
      <InputLabel id={labelId}>{actionLabel}</InputLabel>
      <Select
        labelId={labelId}
        id={actionName}
        label={actionLabel}
        multiple
        value={selectedLevels}
        onChange={handleChange}
        renderValue={renderValue}
      >
        {availableLevels.map((level) => (
          <MenuItem key={level} value={level}>
            <Checkbox checked={selectedLevels.includes(level)} />
            <ListItemText primary={intensityNames[level] || `${t('level')} ${level}`} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
