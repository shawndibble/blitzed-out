import { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import PickConsumptions from './PickConsumptions/index';
import PickActions from './PickActions';
import { purgedFormData } from './helpers';
import { isPublicRoom } from '@/helpers/strings';
import { FormData } from '@/types';
import { Settings } from '@/types/Settings';

interface ActionsStepProps {
  formData: FormData & Partial<Settings>;
  setFormData: React.Dispatch<React.SetStateAction<FormData & Partial<Settings>>>;
  nextStep: () => void;
  prevStep: (count?: number) => void;
  actionsList: Record<string, any>;
}

export default function ActionsStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
  actionsList,
}: ActionsStepProps): JSX.Element {
  function settingSelectLists(type: string): string[] {
    const filteredOptions = Object.keys(actionsList).filter(
      (option) => actionsList[option]?.type === type
    );
    return filteredOptions;
  }

  // on load, purge invalid actions.
  useEffect(() => {
    // purge actions that we shouldn't be able to access.
    const newFormData = purgedFormData(formData);
    setFormData(newFormData);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- This should only run once on mount to clean initial data
  }, []);

  const options = (key: string) =>
    settingSelectLists(key).map((option) => ({
      value: option,
      label: actionsList[option]?.label,
    }));

  // Check if user has made selections
  const hasSelections =
    formData.selectedActions &&
    Object.keys(formData.selectedActions).some(
      (key) =>
        formData.selectedActions![key]?.level > 0 &&
        formData.selectedActions![key]?.variation !== 'appendMost'
    );

  const isNextDisabled = !hasSelections;

  return (
    <Box>
      <Typography variant="body1" sx={{ my: 2 }}>
        <Trans i18nKey="actionsDisclaimer" />
      </Typography>

      <PickActions
        formData={formData}
        setFormData={setFormData}
        options={options}
        actionsList={actionsList}
      />

      <PickConsumptions
        formData={formData}
        setFormData={setFormData}
        options={options}
        actionsList={actionsList}
      />

      <ButtonRow>
        <Button onClick={() => prevStep(isPublicRoom(formData.room) ? 2 : 1)}>
          <Trans i18nKey="previous" />
        </Button>
        <Button variant="contained" disabled={isNextDisabled} onClick={nextStep}>
          <Trans i18nKey="next" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
