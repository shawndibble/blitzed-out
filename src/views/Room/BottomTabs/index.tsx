import * as React from 'react';

import { AppBar } from '@mui/material';
import Box from '@mui/material/Box';
import { ReactNode } from 'react';
import Tab from '@mui/material/Tab';
import TabPanel from '@/components/TabPanel';
import Tabs from '@mui/material/Tabs';
import { a11yProps } from '@/helpers/strings';
import { useTranslation } from 'react-i18next';

export interface BottomTabsProps {
  tab1: ReactNode;
  tab2: ReactNode;
  tab3?: ReactNode;
}

export default function BottomTabs({ tab1, tab2, tab3 }: BottomTabsProps): JSX.Element {
  const [value, setValue] = React.useState<number>(0);
  const { t } = useTranslation();

  const handleChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setValue(newValue);
  };

  return (
    <>
      <AppBar position="fixed" sx={{ top: 'auto', bottom: 0 }}>
        <Tabs value={value} onChange={handleChange} indicatorColor="secondary" variant="fullWidth">
          <Tab label={t('game')} {...a11yProps(0)} />
          <Tab label={t('messages')} {...a11yProps(1)} />
          {tab3 && <Tab label={t('videoCall.title')} {...a11yProps(2)} />}
        </Tabs>
      </AppBar>

      <Box
        sx={{
          paddingTop: '4rem',
          paddingBottom: '48px',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TabPanel value={value} index={0} style={{ flex: 1, overflow: 'hidden', p: 0 }}>
          {tab1}
        </TabPanel>
        <TabPanel value={value} index={1} style={{ flex: 1, overflow: 'hidden', p: 1 }}>
          {tab2}
        </TabPanel>
        {tab3 && (
          <TabPanel value={value} index={2} style={{ flex: 1, overflow: 'hidden', p: 1 }}>
            {tab3}
          </TabPanel>
        )}
      </Box>
    </>
  );
}
