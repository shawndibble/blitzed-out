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
} from '@mui/material';
import { Trans } from 'react-i18next';

export default function MultiSelect({ onChange, values, options, label }) {
  function getLabel(value) {
    return options?.find((option) => option.value === value)?.label;
  }

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
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected?.map((value) => (
              <Chip key={value} label={getLabel(value)} />
            ))}
          </Box>
        )}
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
