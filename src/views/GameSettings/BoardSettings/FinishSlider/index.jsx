import { Box, Divider, Slider, Typography } from '@mui/material';
import { Trans } from 'react-i18next';

export default function FinishSlider({ formData, setFormData }) {
  const handleChange = (_, newValue) => {
    setFormData({ ...formData, finishRange: newValue, boardUpdated: true });
  };

  const finishRange = formData?.finishRange || [30, 70];

  return (
    <Box>
      <Divider />
      <Typography id="finish-slider" sx={{ my: 1 }}>
        <Trans i18nKey="finishSlider" />
      </Typography>
      <Slider
        aria-labelledby="finish-slider"
        value={finishRange}
        onChange={handleChange}
        valueLabelDisplay="off"
      />
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        textAlign="center"
      >
        <Typography whiteSpace="nowrap">
          <Trans i18nKey="noCum" /> {finishRange[0]}%
        </Typography>
        <Typography whiteSpace="nowrap">
          <Trans i18nKey="ruined" /> {finishRange[1] - finishRange[0]}%
        </Typography>
        <Typography whiteSpace="nowrap">
          <Trans i18nKey="cum" /> {100 - finishRange[1]}%
        </Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
    </Box>
  );
}
