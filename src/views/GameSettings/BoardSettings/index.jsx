import { Divider, Grid } from '@mui/material';
import useBreakpoint from 'hooks/useBreakpoint';
import GridItem from 'components/GridItem';
import SettingsSelect from 'components/SettingsSelect';
import FinishSlider from './FinishSlider';
import SelectBoardSetting from './SelectBoardSetting';
import SoloSwitch from './SoloSwitch';

export default function BoardSettings({ formData, setFormData, actionsList }) {
  const { alcohol, poppers, ...remainingActions } = actionsList;
  const isMobile = useBreakpoint('md');
  const isLocal = formData.room !== 'public' && formData.gameMode === 'local';

  const settingSelectLists = Object.keys(remainingActions).map((option) => (
    <Grid item xs={12} sm={isMobile && !isLocal ? 6 : 12} md={5} key={option}>
      <SelectBoardSetting
        option={option}
        settings={formData}
        setSettings={setFormData}
        actionsFolder={remainingActions}
        showRole={isLocal}
      />
    </Grid>
  ));

  // go through all entries in formData and update the vale if the key contains the word role
  const updateAllRoles = (value) => {
    const newFormData = structuredClone(formData);
    Object.keys(newFormData).forEach((key) => {
      if (key.includes('role')) {
        newFormData[key] = value;
      }
    });
    return newFormData;
  };

  return (
    <>
      <Grid container columnSpacing={2} justifyContent='center'>
        <Grid item xs={12} md={5}>
          <SelectBoardSetting
            option='alcohol'
            settings={formData}
            setSettings={setFormData}
            actionsFolder={actionsList}
            showVariation
          />
        </Grid>
        {!isMobile && (
          <Divider
            orientation='vertical'
            flexItem
            sx={{ pl: 1, pr: 2 }}
            variant='middle'
          />
        )}
        <Grid item xs={12} md={5}>
          <SelectBoardSetting
            option='poppers'
            settings={formData}
            setSettings={setFormData}
            actionsFolder={actionsList}
            showVariation
          />
        </Grid>
      </Grid>
      {formData.room !== 'public' && (
        <SoloSwitch formData={formData} setFormData={setFormData} />
      )}
      <Grid container columnSpacing={2} justifyContent='center'>
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
              label='mainRole'
              options={['sub', 'vers', 'dom']}
              defaultValue='sub'
            />
          </GridItem>
        )}
      </Grid>

      <Divider />

      <Grid container columnSpacing={2} justifyContent='space-evenly'>
        {settingSelectLists}
        <GridItem>
          <SettingsSelect
            value={formData.difficulty}
            onChange={(event) =>
              setFormData({
                ...formData,
                difficulty: event.target.value,
                boardUpdated: true,
              })
            }
            label='difficulty'
            options={['normal', 'accelerated']}
            defaultValue='normal'
          />
        </GridItem>
      </Grid>

      <FinishSlider setFormData={setFormData} formData={formData} />
    </>
  );
}
