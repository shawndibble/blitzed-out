import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { Trans } from 'react-i18next';

export default function SettingsSelect({
  value,
  onChange,
  label,
  options,
  defaultValue = null,
  sx,
}) {
  const items = options.map((option) => (
    <MenuItem key={option} value={option}>
      <Trans i18nKey={option} />
    </MenuItem>
  ));

  return (
    <FormControl fullWidth margin='normal' sx={sx}>
      <InputLabel id={`${label}Label`}>
        <Trans i18nKey={label} />
      </InputLabel>
      <Select
        labelId={`${label}Label`}
        id={label}
        label={<Trans i18nKey={label} />}
        value={value || defaultValue}
        onChange={onChange}
      >
        {items}
      </Select>
    </FormControl>
  );
}
