import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import useHasMouse from 'hooks/useHasMouse';
import { useState } from 'react';

export default function IncrementalSelect({
  actionsFolder,
  settings,
  option,
  onChange,
  initialValue = 0,
}) {
  const labelId = `${option}label`;
  const label = actionsFolder[option]?.label;

  const hasMouse = useHasMouse();
  const [hoveredOption, setHoveredOption] = useState(settings[option]?.level || 0);

  const handleMouseOver = (index) => {
    setHoveredOption(index);
  };

  const showCheckbox = (index) => {
    if (hoveredOption > 0 && index === 0) {
      return false;
    }
    if (settings.difficulty === 'accelerated') {
      if (hoveredOption <= 2) return hoveredOption === index;
      return hoveredOption === index || hoveredOption - 1 === index;
    }
    return hoveredOption >= index;
  };

  function getOptions(category) {
    return Object.keys(actionsFolder[category]?.actions).map((optionVal, index) => (
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
    <FormControl fullWidth margin="normal">
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        id={option}
        label={label}
        value={settings[option]?.level || initialValue}
        onChange={onChange}
        onOpen={() => setHoveredOption(settings[option]?.level || initialValue)}
        onClose={() => setHoveredOption(settings[option]?.level || initialValue)}
      >
        {getOptions(option)}
      </Select>
    </FormControl>
  );
}
