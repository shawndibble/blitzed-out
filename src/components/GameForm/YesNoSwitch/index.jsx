import { Box, FormControlLabel, Switch } from '@mui/material';
import { Trans } from 'react-i18next';

export default function YesNoSwitch({ trueCondition, onChange, yesLabel, noLabel, sx = {} }) {
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
        label={<Trans i18nKey={trueCondition ? yesLabel : noLabel} />}
      />
    </Box>
  );
}
