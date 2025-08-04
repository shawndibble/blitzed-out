import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { GroupedActions } from '@/types/customTiles';
import { Settings } from '@/types/Settings';

interface IncrementalSelectProps {
  actionsFolder: GroupedActions;
  settings: Settings;
  option: string;
  onChange: (event: SelectChangeEvent<number[]>) => void;
  initValue?: number[];
}

export default function IncrementalSelect({
  actionsFolder,
  settings,
  option,
  onChange,
  initValue = [],
}: IncrementalSelectProps): JSX.Element {
  const labelId = `${option}label`;
  const label = actionsFolder[option]?.label;

  // Get current levels from selectedActions structure only
  const getCurrentLevels = (): number[] => {
    return settings.selectedActions?.[option]?.levels || initValue;
  };

  const handleChange = (event: SelectChangeEvent<number[]>) => {
    onChange(event);
  };

  function getOptions(category: string) {
    const currentLevels = getCurrentLevels();
    return Object.keys(actionsFolder[category]?.actions || {}).map((optionVal, index) => (
      <MenuItem value={index} key={`${category}-${optionVal}`}>
        <Checkbox checked={currentLevels.includes(index)} />
        <ListItemText primary={optionVal} />
      </MenuItem>
    ));
  }

  // Custom render function to display selected intensity level names
  const renderValue = (selected: number[]) => {
    const actionKeys = Object.keys(actionsFolder[option]?.actions || {});
    return selected
      .map((levelIndex) => actionKeys[levelIndex])
      .filter(Boolean)
      .join(', ');
  };

  return (
    <FormControl margin="normal" fullWidth>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        id={option}
        label={label}
        multiple
        value={getCurrentLevels()}
        onChange={handleChange}
        renderValue={renderValue}
      >
        {getOptions(option)}
      </Select>
    </FormControl>
  );
}
