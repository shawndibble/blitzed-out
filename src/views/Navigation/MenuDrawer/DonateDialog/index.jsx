import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Dialog, DialogTitle, Tab, Tabs, Typography } from '@mui/material';
import TabPanel from 'components/TabPanel';
import { a11yProps } from 'helpers/strings';
import Venmo from 'images/venmo.png';
import CashApp from 'images/cashapp.png';
import { Trans } from 'react-i18next';
import CloseIcon from 'components/CloseIcon';

export default function DonateDialog({ open, close, isMobile }) {
  const [tabVal, setTab] = useState(0);
  const changeTab = (_, newVal) => setTab(newVal);

  return (
    <Dialog fullScreen={isMobile} open={open} onClose={close}>
      <DialogTitle>
        <Trans i18nKey="donateToHelp" />
        <CloseIcon close={close} />
      </DialogTitle>
      <Tabs value={tabVal} onChange={changeTab} aria-label="donate options">
        <Tab label="Venmo" {...a11yProps(0)} />
        <Tab label="Cashapp" {...a11yProps(1)} />
      </Tabs>
      <TabPanel value={tabVal} index={0}>
        <Box sx={{ textAlign: 'center' }}>
          <Link to="https://venmo.com/code?user_id=3818104727537125276">
            <Typography variant="h4">@blitzedout</Typography>
          </Link>
        </Box>
        <Box
          component="img"
          sx={{ maxWidth: 550, width: 'calc(100vw - 45px)' }}
          alt="Venmo QR code"
          src={Venmo}
        />
      </TabPanel>
      <TabPanel value={tabVal} index={1}>
        <Box sx={{ textAlign: 'center' }}>
          <Link to="https://cash.app/$krishmero">
            <Typography variant="h4">$KrishMero</Typography>
          </Link>
        </Box>
        <Box
          component="img"
          sx={{
            padding: 4,
            background: 'white',
            maxWidth: 500,
            borderRadius: 5,
            margin: 3,
            width: 'calc(100vw - 100)',
          }}
          alt="Venmo QR code"
          src={CashApp}
        />
      </TabPanel>
    </Dialog>
  );
}
