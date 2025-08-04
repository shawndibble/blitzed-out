import { Divider, Grid, SelectChangeEvent, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { isOnlineMode, isPublicRoom } from '@/helpers/strings';

import FinishSlider from './FinishSlider';
import GridItem from '@/components/GridItem';
import InvisibleAccordionGrid from '@/components/InvisibleAccordionGrid';
import SelectBoardSetting from './SelectBoardSetting';
import { Settings } from '@/types/Settings';
import SettingsSelect from '@/components/SettingsSelect';
import SoloSwitch from './SoloSwitch';
import WarningAlert from './WarningAlert';
import { useLocalPlayerStore } from '@/stores/localPlayerStore';

interface BoardSettingsProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  actionsList: Record<string, any>;
}

export default function BoardSettings({
  formData,
  setFormData,
  actionsList,
}: BoardSettingsProps): JSX.Element {
  const { t } = useTranslation();
  const { hasLocalPlayers } = useLocalPlayerStore();
  const isLocal = !isOnlineMode(formData.gameMode);
  const shouldShowRoleSelect = !hasLocalPlayers();

  // Helper function to check if any options are selected for a given type
  function hasSelectedOptionsForType(type: 'sex' | 'foreplay' | 'consumption' | 'solo'): boolean {
    return Object.keys(actionsList)
      .filter((option) => actionsList[option]?.type === type)
      .some((option) => {
        const selectedAction = formData.selectedActions?.[option];
        return selectedAction?.levels && selectedAction.levels.length > 0;
      });
  }

  function settingSelectLists(
    type: 'sex' | 'foreplay' | 'consumption' | 'solo',
    extraProps: Record<string, any> = {}
  ): JSX.Element[] {
    return Object.keys(actionsList)
      .filter((option) => actionsList[option]?.type === type)
      .map((option) => (
        <GridItem key={option}>
          <SelectBoardSetting
            option={option}
            settings={formData}
            setSettings={setFormData}
            actionsFolder={actionsList}
            type={type}
            {...extraProps}
          />
        </GridItem>
      ));
  }

  // go through all entries in formData and update the value if the key contains the word role
  const updateAllRoles = (value: string): Settings => {
    const newFormData = JSON.parse(JSON.stringify(formData));
    Object.keys(newFormData).forEach((key) => {
      newFormData.role = value;
      if (key.includes('role')) {
        newFormData[key] = value;
      }
    });
    return newFormData;
  };

  return (
    <>
      <SoloSwitch formData={formData} setFormData={setFormData} />

      {isPublicRoom(formData?.room) && !isOnlineMode(formData.gameMode) && (
        <Grid container alignContent="center" justifyContent="space-evenly">
          <Grid sx={{ py: 3 }}>
            <Typography variant="h5">
              <Trans i18nKey="privateRequired" />
            </Typography>
          </Grid>
        </Grid>
      )}

      {isLocal ? (
        <>
          <Grid container columnSpacing={2} justifyContent="space-evenly">
            {shouldShowRoleSelect && (
              <GridItem>
                <SettingsSelect
                  value={formData.role}
                  onChange={(event: SelectChangeEvent<string>) =>
                    setFormData({
                      ...updateAllRoles(event.target.value),
                      boardUpdated: true,
                    })
                  }
                  label="mainRole"
                  options={['dom', 'vers', 'sub']}
                  defaultValue="sub"
                />
              </GridItem>
            )}
          </Grid>
          <InvisibleAccordionGrid
            title={t('consumption')}
            subtitle={t('consumptionSubtitle')}
            hasSelectedOptions={hasSelectedOptionsForType('consumption')}
          >
            {settingSelectLists('consumption', { showVariation: true })}
          </InvisibleAccordionGrid>
          <InvisibleAccordionGrid
            title={t('foreplay')}
            subtitle={t('foreplaySubtitle')}
            hasSelectedOptions={hasSelectedOptionsForType('foreplay')}
          >
            {settingSelectLists('foreplay', { showRole: shouldShowRoleSelect })}
          </InvisibleAccordionGrid>
          <InvisibleAccordionGrid
            title={t('sex')}
            subtitle={t('sexSubtitle')}
            hasSelectedOptions={hasSelectedOptionsForType('sex')}
          >
            {settingSelectLists('sex', { showRole: shouldShowRoleSelect })}
          </InvisibleAccordionGrid>
        </>
      ) : (
        <>
          <Grid container columnSpacing={2} justifyContent="space-evenly">
            {settingSelectLists('consumption', { showVariation: true })}
          </Grid>
          <Divider />
          <Grid container columnSpacing={2} justifyContent="center">
            {settingSelectLists('solo')}
          </Grid>
        </>
      )}

      <FinishSlider setFormData={setFormData} formData={formData} />

      <WarningAlert formData={formData} />
    </>
  );
}
