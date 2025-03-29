import { useState, useEffect, ChangeEvent } from 'react';
import { Box, Button, Typography, Collapse, SelectChangeEvent } from '@mui/material';
import { Trans } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import SettingsSelect from '@/components/SettingsSelect';
import YesNoSwitch from '@/components/GameForm/YesNoSwitch';
import { isOnlineMode } from '@/helpers/strings';
import { FormData } from '@/types';
import { PlayerRole, Settings } from '@/types/Settings';

interface GameModeStepProps {
  formData: FormData & Partial<Settings>;
  setFormData: React.Dispatch<React.SetStateAction<FormData & Partial<Settings>>>;
  nextStep: () => void;
  prevStep: () => void;
}

export default function GameModeStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: GameModeStepProps): JSX.Element {
  const [visible, setVisible] = useState(!isOnlineMode(formData?.gameMode));

  // Update visibility when game mode changes
  useEffect(() => {
    setVisible(!isOnlineMode(formData?.gameMode));
  }, [formData?.gameMode]);

  return (
    <Box sx={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6">
        <Trans i18nKey="playingWithPeople" />
      </Typography>
      <YesNoSwitch
        trueCondition={!isOnlineMode(formData?.gameMode)}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          setFormData({
            ...formData,
            gameMode: event.target.checked ? 'local' : 'online',
            roomRealtime: !event.target.checked,
          })
        }
        yesLabel="yesInteracting"
      />

      <Collapse in={visible} timeout={500} sx={{ mt: visible ? 2 : 0 }}>
        <Box>
          <Typography variant="h6">
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
              onChange={(event: SelectChangeEvent<string>) =>
                setFormData({
                  ...formData,
                  role: event.target.value as PlayerRole,
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
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setFormData({
                ...formData,
                isNaked: event.target.checked,
              })
            }
            trueCondition={formData.isNaked}
            yesLabel="yesNaked"
          />
        </Box>
      </Collapse>

      <Box sx={{ flexGrow: 1 }} />
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
