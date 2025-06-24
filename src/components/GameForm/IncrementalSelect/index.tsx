import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import useHasMouse from '@/hooks/useHasMouse';
import { useState } from 'react';
import { GroupedActions } from '@/types/customTiles';
import { Settings } from '@/types/Settings';

interface IncrementalSelectProps {
  actionsFolder: GroupedActions;
  settings: Settings;
  option: string;
  onChange: (event: SelectChangeEvent<number>) => void;
  initValue?: number;
}

export default function IncrementalSelect({
  actionsFolder,
  settings,
  option,
  onChange,
  initValue = 0,
}: IncrementalSelectProps): JSX.Element {
  const labelId = `${option}label`;
  const label = actionsFolder[option]?.label;

  const hasMouse = useHasMouse();
  const [hoveredOption, setHoveredOption] = useState<number>(settings[option]?.level || 0);

  const handleMouseOver = (index: number) => {
    setHoveredOption(index);
  };

  const showCheckbox = (index: number): boolean => {
    if (hoveredOption > 0 && index === 0) {
      return false;
    }
    if (settings.difficulty === 'accelerated') {
      if (hoveredOption <= 2) return hoveredOption === index;
      return hoveredOption === index || hoveredOption - 1 === index;
    }
    return hoveredOption >= index;
  };

  function getOptions(category: string) {
    return Object.keys(actionsFolder[category]?.actions || {}).map((optionVal, index) => (
      <MenuItem
        value={index}
        key={`${category}-${optionVal}`}
        onMouseOver={() => handleMouseOver(index)}
      >
        {!!hasMouse && (
          <span className="menu-item-icon">
            {showCheckbox(index) ? <CheckBox /> : <CheckBoxOutlineBlank />}
          </span>
        )}
        {optionVal}
      </MenuItem>
    ));
  }

  return (
    <FormControl margin="normal" fullWidth>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        id={option}
        label={label}
        value={settings[option]?.level || initValue}
        onChange={onChange}
        onOpen={() => setHoveredOption(settings[option]?.level || initValue)}
        onClose={() => setHoveredOption(settings[option]?.level || initValue)}
      >
        {getOptions(option)}
      </Select>
    </FormControl>
  );
}
