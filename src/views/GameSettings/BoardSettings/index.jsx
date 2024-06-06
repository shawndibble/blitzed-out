import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import useBreakpoint from 'hooks/useBreakpoint';
import GridItem from 'components/GridItem';
import SettingsSelect from 'components/SettingsSelect';
import { Trans, useTranslation } from 'react-i18next';
import InvisibleAccordionGrid from 'components/InvisibleAccordionGrid';
import FinishSlider from './FinishSlider';
import SelectBoardSetting from './SelectBoardSetting';
import SoloSwitch from './SoloSwitch';
import WarningAlert from './WarningAlert';

export default function BoardSettings({ formData, setFormData, actionsList }) {
  const { t } = useTranslation();
  const isMobile = useBreakpoint('md');
  const isLocal =
    formData?.room.toUpperCase() !== 'PUBLIC' && formData.gameMode === 'local';

  function settingSelectLists(type, extraProps = {}) {
    return Object.keys(actionsList)
      .filter((option) => actionsList[option]?.type === type)
      .map((option) => (
        <GridItem sm={isMobile && !isLocal ? 6 : 12} key={option}>
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

  // go through all entries in formData and update the vale if the key contains the word role
  const updateAllRoles = (value) => {
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

      {formData?.room.toUpperCase() === 'PUBLIC' &&
        formData.gameMode === 'local' && (
          <Grid container alignContent="center" justifyContent="space-evenly">
            <Grid item sx={{ py: 3 }}>
              <Typography variant="h5">
                <Trans i18nKey="privateRequired" />
              </Typography>
            </Grid>
          </Grid>
        )}

      <Grid container columnSpacing={2} justifyContent="space-evenly">
        <GridItem>
          <Tooltip
            placement="top"
            title={
              <Trans i18nKey="difficultyTooltip">
                <Typography variant="body2">
                  Normal = Slow ramp up. <br />
                  <br />
                  Accelerated = Straight to max level + the level prior to it.
                </Typography>
              </Trans>
            }
            arrow
          >
            <SettingsSelect
              value={formData.difficulty}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  difficulty: event.target.value,
                  boardUpdated: true,
                })
              }
              label="difficulty"
              options={['normal', 'accelerated']}
              defaultValue="normal"
              helpIcon
            />
          </Tooltip>
        </GridItem>
        {isLocal && (
          <GridItem>
            <SettingsSelect
              value={formData.role}
              onChange={(event) =>
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

      {isLocal ? (
        <>
          <InvisibleAccordionGrid
            title={t('consumption')}
            subtitle={t('consumptionSubtitle')}
          >
            {settingSelectLists('consumption', { showVariation: true })}
          </InvisibleAccordionGrid>
          <InvisibleAccordionGrid
            title={t('foreplay')}
            subtitle={t('foreplaySubtitle')}
          >
            {settingSelectLists('foreplay', { showRole: isLocal })}
          </InvisibleAccordionGrid>
          <InvisibleAccordionGrid title={t('sex')} subtitle={t('sexSubtitle')}>
            {settingSelectLists('sex', { showRole: isLocal })}
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
