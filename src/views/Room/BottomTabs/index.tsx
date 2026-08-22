import * as React from 'react';

import { AppBar } from '@mui/material';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import { ReactNode } from 'react';
import Tab from '@mui/material/Tab';
import TabPanel from '@/components/TabPanel';
import Tabs from '@mui/material/Tabs';
import { a11yProps } from '@/helpers/strings';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/stores/settingsStore';
import { useCallPresenceStore } from '@/stores/callPresenceStore';
import { vibrate } from '@/utils/haptics';

/**
 * The fixed top nav's real height: a dense `Toolbar` (48px floor) whose tallest child
 * is a 40px `IconButton` inside 5px vertical padding, plus the status-bar inset the
 * bar pads itself by — `viewport-fit=cover` puts the page under it.
 */
const NAV_HEIGHT = 'calc(50px + env(safe-area-inset-top))';
/**
 * MUI `Tabs` default min-height, plus the home-indicator inset the bar now pads itself
 * by. Reserve and bar have to agree, or the last panel row hides behind the tabs.
 */
const TAB_BAR_HEIGHT = 'calc(48px + env(safe-area-inset-bottom))';

export interface BottomTabsProps {
  tab1: ReactNode;
  tab2: ReactNode;
  tab3?: ReactNode;
}

export default function BottomTabs({ tab1, tab2, tab3 }: BottomTabsProps): JSX.Element {
  const [value, setValue] = React.useState<number>(0);
  const { t } = useTranslation();
  const [settings] = useSettings();
  const participants = useCallPresenceStore((state) => state.count);

  const handleChange = (_event: React.SyntheticEvent, newValue: number): void => {
    if (settings?.hapticFeedback) {
      vibrate('short');
    }
    setValue(newValue);
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{ top: 'auto', bottom: 0, paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Tabs value={value} onChange={handleChange} indicatorColor="secondary" variant="fullWidth">
          <Tab label={t('game')} {...a11yProps(0)} />
          <Tab label={t('messages')} {...a11yProps(1)} />
          {tab3 && (
            <Tab
              label={
                // Badged rather than folded into the string, so the count needs no
                // per-locale plural form and reads the same as the desktop icon.
                <Badge
                  badgeContent={participants}
                  color="secondary"
                  sx={{ '& .MuiBadge-badge': { right: -12, top: 2 } }}
                >
                  {t('videoCall.title')}
                </Badge>
              }
              aria-label={[
                t('videoCall.title'),
                participants > 0 ? t('videoCall.onCall', { count: participants }) : null,
              ]
                .filter(Boolean)
                .join(', ')}
              {...a11yProps(2)}
            />
          )}
        </Tabs>
      </AppBar>

      <Box
        sx={{
          paddingTop: NAV_HEIGHT,
          paddingBottom: TAB_BAR_HEIGHT,
          // Plain viewport units map to the *large* viewport by spec, so `100vh`
          // overshoots on iOS Safari and hides the tab bar under the URL bar. `svh`
          // is the smallest stable height and never thrashes mid-scroll like `dvh`.
          height: '100svh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TabPanel value={value} index={0} style={{ p: 0 }}>
          {tab1}
        </TabPanel>
        <TabPanel value={value} index={1} style={{ p: 1 }}>
          {tab2}
        </TabPanel>
        {tab3 && (
          <TabPanel value={value} index={2} style={{ p: 1 }}>
            {tab3}
          </TabPanel>
        )}
      </Box>
    </>
  );
}
