import { useState } from 'react';
import { Box, Collapse, Link, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';

/**
 * Inline help for the custom-background URL field. A one-line prompt plus a
 * collapsible "Supported sites" panel that groups the accurate, current list
 * (direct media links work anywhere; page links work for the listed sites).
 */
export default function SupportedSitesHelp(): JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ mt: 0.5, ml: 1.75 }}>
      <Typography variant="caption" color="text.secondary" component="div">
        {t('supportedSitesPrompt')}{' '}
        <Link
          component="button"
          type="button"
          variant="caption"
          underline="hover"
          onClick={() => setOpen((prev) => !prev)}
          sx={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
        >
          {t('supportedSitesTitle')}
          <ExpandMoreIcon
            fontSize="inherit"
            sx={{
              ml: 0.25,
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          />
        </Link>
      </Typography>
      <Collapse in={open} unmountOnExit>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
          {t('supportedSitesDirect')}
          <br />
          {t('supportedSites')}
          <br />
          {t('supportedSitesTips')}
          <br />
          {t('requiresEmbeddedUrl')}
        </Typography>
      </Collapse>
    </Box>
  );
}
