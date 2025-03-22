import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { a11yProps } from '@/helpers/strings';
import TabPanel from '@/components/TabPanel';
import { useTranslation } from 'react-i18next';

import { BottomTabsProps } from './types';

export default function BottomTabs({ tab1, tab2 }: BottomTabsProps): JSX.Element {
  const theme = useTheme();
  const [value, setValue] = React.useState<number>(0);
  const { t } = useTranslation();

  const handleChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setValue(newValue);
  };

  return (
    <Box>
      <AppBar position="fixed" sx={{ top: 'auto', bottom: 0 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
        >
          <Tab label={t('game')} {...a11yProps(0)} />
          <Tab label={t('messages')} {...a11yProps(1)} />
        </Tabs>
      </AppBar>
      <TabPanel value={value} index={0} dir={theme.direction} style={{ p: 0 }}>
        {tab1}
      </TabPanel>
      <TabPanel value={value} index={1} dir={theme.direction} style={{ p: 0 }}>
        {tab2}
      </TabPanel>
    </Box>
  );
}
