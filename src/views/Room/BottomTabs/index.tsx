import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { a11yProps } from '@/helpers/strings';
import TabPanel from '@/components/TabPanel';
import { useTranslation } from 'react-i18next';
import { ReactNode } from 'react';
import { AppBar } from '@mui/material';

export interface BottomTabsProps {
  tab1: ReactNode;
  tab2: ReactNode;
}

export default function BottomTabs({ tab1, tab2 }: BottomTabsProps): JSX.Element {
  const [value, setValue] = React.useState<number>(0);
  const { t } = useTranslation();

  const handleChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setValue(newValue);
  };

  return (
    <>
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

      <Box sx={{ marginTop: '3rem', height: 'calc(100vh - 3rem)', overflowY: 'auto' }}>
        <TabPanel value={value} index={0}>
          {tab1}
        </TabPanel>
        <TabPanel value={value} index={1}>
          {tab2}
        </TabPanel>
      </Box>
    </>
  );
}
