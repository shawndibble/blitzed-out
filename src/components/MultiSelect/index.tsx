import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { Trans } from 'react-i18next';
import { ReactNode, useCallback } from 'react';

interface Option {
  value: string;
  label: ReactNode;
}

interface MultiSelectProps {
  onChange: (event: SelectChangeEvent<string[]>) => void;
  values: string[];
  options: Option[];
  label: string;
}

export default function MultiSelect({
  onChange,
  values,
  options,
  label,
}: MultiSelectProps): JSX.Element {
  // Memoize the label lookup function for better performance
  const getLabel = useCallback(
    (value: string): ReactNode => {
      return options?.find((option) => option.value === value)?.label;
    },
    [options]
  );

  // Memoize the renderValue function to prevent unnecessary re-renders
  const renderValue = useCallback(
    (selected: string[] | unknown) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {(selected as string[])?.map((value) => (
          <Chip key={value} label={getLabel(value)} />
        ))}
      </Box>
    ),
    [getLabel]
  );

  return (
    <FormControl fullWidth>
      <InputLabel id={`${label}-label`}>{label}</InputLabel>
      <Select
        labelId={`${label}-label`}
        id={`${label}`}
        multiple
        value={values}
        onChange={onChange}
        fullWidth
        input={<OutlinedInput label={<Trans i18nKey="actionsLabel" />} />}
        renderValue={renderValue}
      >
        {options?.map(({ label, value }) => (
          <MenuItem key={value} value={value}>
            <Checkbox checked={values.includes(value)} />
            <ListItemText primary={label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
