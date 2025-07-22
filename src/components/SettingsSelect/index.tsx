import { Help } from '@mui/icons-material';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  SxProps,
  Theme,
} from '@mui/material';
import { t } from 'i18next';
import { forwardRef, ReactNode, useMemo } from 'react';
import { Trans } from 'react-i18next';

interface OptionObject {
  value: string;
  label: ReactNode;
}

type Option = string | OptionObject;

interface SettingsSelectProps {
  value: string | null;
  onChange: (event: SelectChangeEvent<string>) => void;
  label: string;
  options: Option[];
  defaultValue?: string | null;
  sx?: SxProps<Theme>;
  helpIcon?: boolean;
  fullWidth?: boolean;
  [key: string]: any;
}

const SettingsSelect = forwardRef<HTMLDivElement, SettingsSelectProps>(
  (
    {
      value,
      onChange,
      label,
      options,
      defaultValue = null,
      sx,
      helpIcon = false,
      fullWidth = true,
      ...rest
    },
    ref
  ) => {
    // Memoize the items array to prevent unnecessary re-renders
    const items = useMemo(() => {
      return options.map((option: Option) => {
        if (typeof option === 'string') {
          return (
            <MenuItem key={option} value={option}>
              {t(option)}
            </MenuItem>
          );
        }

        return (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        );
      });
    }, [options]);

    return (
      <FormControl fullWidth={fullWidth} margin="normal" sx={sx} {...rest} ref={ref}>
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
          value={value || defaultValue || ''}
          onChange={onChange}
        >
          {items}
        </Select>
      </FormControl>
    );
  }
);

export default SettingsSelect;
