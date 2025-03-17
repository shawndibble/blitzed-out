import { Box, FormControlLabel, Switch, SxProps, Theme } from '@mui/material';
import { Trans } from 'react-i18next';
import { ChangeEvent } from 'react';

interface YesNoSwitchProps {
  trueCondition: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  yesLabel: string;
  noLabel?: string | null;
  sx?: SxProps<Theme>;
}

export default function YesNoSwitch({
  trueCondition,
  onChange,
  yesLabel,
  noLabel = null,
  sx = {},
}: YesNoSwitchProps): JSX.Element {
  // if we were not provided a noLabel, use the same label as the yesLabel
  const actuallyNoLabel = noLabel ?? yesLabel;
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        my: 1,
        ...sx,
      }}
    >
      <FormControlLabel
        control={<Switch checked={trueCondition || false} onChange={onChange} />}
        label={<Trans i18nKey={trueCondition ? yesLabel : actuallyNoLabel} />}
      />
    </Box>
  );
}
