import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import ButtonRow from 'components/ButtonRow';
import SettingsSelect from 'components/SettingsSelect';
import YesNoSwitch from 'components/GameForm/YesNoSwitch';

export default function GameModeStep({ formData, setFormData, nextStep, prevStep }) {
  return (
    <Box>
      <Typography variant="h6">
        <Trans i18nKey="playingWithPeople" />
      </Typography>
      <YesNoSwitch
        trueCondition={formData?.gameMode === 'local'}
        onChange={(event) => {
          console.log(formData);
          setFormData({
            ...formData,
            gameMode: event.target.checked ? 'local' : 'online',
            roomRealtime: !event.target.checked,
          });
        }}
        yesLabel="yesInteracting"
        noLabel="noInteracting"
      />

      {formData.gameMode === 'local' && (
        <>
          <Typography variant="h6" sx={{ mt: 2 }}>
            <Trans i18nKey="yourRole" />
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <SettingsSelect
              value={formData.role}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  role: event.target.value,
                })
              }
              label="mainRole"
              options={['dom', 'vers', 'sub']}
              defaultValue="sub"
              fullWidth={false}
            />
          </Box>

          <Typography variant="h6" sx={{ mt: 1 }}>
            <Trans i18nKey="areYouNaked" />
          </Typography>

          <Typography variant="body2" sx={{ mt: 1 }}>
            <Trans i18nKey="nakedDisclaimer" />
          </Typography>

          <YesNoSwitch
            onChange={(event) =>
              setFormData({
                ...formData,
                isNaked: event.target.checked,
              })
            }
            trueCondition={formData.isNaked}
            yesLabel="yesNaked"
            noLabel="noNaked"
          />
        </>
      )}

      <ButtonRow>
        <Button onClick={prevStep}>
          <Trans i18nKey="previous" />
        </Button>
        <Button variant="contained" onClick={nextStep}>
          <Trans i18nKey="next" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
