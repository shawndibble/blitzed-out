import { Help } from '@mui/icons-material';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { forwardRef } from 'react';
import { Trans } from 'react-i18next';

const SettingsSelect = forwardRef(({
  value,
  onChange,
  label,
  options,
  defaultValue = null,
  sx,
  helpIcon = false,
  ...rest
}, ref) => {
  const items = options.map((option) => (
    <MenuItem key={option} value={option}>
      <Trans i18nKey={option} />
    </MenuItem>
  ));

  return (
    <FormControl fullWidth margin='normal' sx={sx} {...rest} ref={ref}>
      <InputLabel id={`${label}Label`}>
        <Trans i18nKey={label} />
        {!!helpIcon && <Help sx={{ ml: 1, fontSize: 16 }} />}
      </InputLabel>
      <Select
        labelId={`${label}Label`}
        id={label}
        label={
          <>
            <Trans i18nKey={label} />
            {!!helpIcon && <Help sx={{ ml: 1, fontSize: 16 }} />}
          </>
        }
        value={value || defaultValue}
        onChange={onChange}
      >
        {items}
      </Select>
    </FormControl>
  );
});

export default SettingsSelect;
