import {
  Box, Divider, Slider, Typography,
} from '@mui/material';
import { Trans } from 'react-i18next';

export default function FinishSlider({ formData, setFormData }) {
  const handleChange = (_, newValue) => {
    setFormData({ ...formData, finishRange: newValue, boardUpdated: true });
  };

  return (
    <Box>
      <Divider />
      <Typography id="finish-slider" sx={{ my: 1 }}><Trans i18nKey="finishSlider" /></Typography>
      <Slider
        aria-labelledby="finish-slider"
        value={formData.finishRange}
        onChange={handleChange}
        valueLabelDisplay="off"
      />
      <Box display="flex" justifyContent="space-between">
        <Typography whiteSpace="nowrap">
          <Trans i18nKey="noCum" />
          {' '}
          { formData.finishRange[0] }
          %
        </Typography>
        <Typography>|</Typography>
        <Typography whiteSpace="nowrap">
          <Trans i18nKey="ruined" />
          {' '}
          {formData.finishRange[1] - formData.finishRange[0]}
          %
        </Typography>
        <Typography>|</Typography>
        <Typography whiteSpace="nowrap">
          <Trans i18nKey="cum" />
          {' '}
          {100 - formData.finishRange[1]}
          %
        </Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
    </Box>
  );
}
