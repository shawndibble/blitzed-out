import {
  Box, Button, IconButton, TextField, Tooltip, Typography,
} from '@mui/material';
import { submitCustomAction } from 'services/firebase';
import { useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Accordion from 'components/Accordion';
import AccordionSummary from 'components/Accordion/Summary';
import AccordionDetails from 'components/Accordion/Details';
import { ContentCopy } from '@mui/icons-material';

export default function ImportExport({
  expanded, handleChange, customTiles, mappedGroups, setSubmitMessage, bulkImport,
}) {
  const formData = useRef();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  const exportData = () => {
    const customString = customTiles.map(({ group, intensity, action }) => {
      const userData = mappedGroups
        .find((entry) => entry?.intensity === Number(intensity) && entry?.value === group);
      return `[${userData?.group} - ${userData?.translatedIntensity}]\n${action}`;
    });

    setInputValue(customString.join('\n---\n'));
  };

  function importTiles() {
    const { importData } = formData.current;
    let result = [];

    const preArray = importData?.value?.split('---');

    try {
      preArray.forEach((e) => {
        const groupMatch = e.match(/\[|\]/g)?.length;
        if (groupMatch > 2 || groupMatch < 2) {
          throw setSubmitMessage({
            type: 'error',
            message: t('ctSeparatorError'),
          });
        }
      });

      result = preArray.map((tile) => {
        const [preGrouping, action] = tile.split('\n').filter((n) => n);
        const withoutBrackets = preGrouping?.replace(/\[|\]/g, '');
        if (withoutBrackets === undefined) {
          return null;
        }
        const [group, intensity] = withoutBrackets.split(' - ');
        const appGroup = mappedGroups
          .find((mapped) => mapped.translatedIntensity === intensity && mapped.group === group);

        if (appGroup === undefined) {
          throw setSubmitMessage({
            type: 'error',
            message: t('ctGroupError'),
          });
        }

        if (!action) {
          throw setSubmitMessage({
            type: 'error',
            message: t('ctActionError'),
          });
        }

        return { group: appGroup.value, intensity: appGroup.intensity, action };
      });
    } catch (error) {
      return console.error(error);
    }

    const uniqueRecords = [];
    result
      // filter new records
      .filter((entry) => !customTiles
        .some((existing) => existing.group === entry?.group
        && existing.intensity === entry?.intensity
        && existing.action === entry?.action))
      // drop empty records
      .filter((n) => n)
      // filter unique records
      .filter((entry) => {
        const index = uniqueRecords.findIndex((existing) => existing.group === entry.group
          && existing.intensity === entry.intensity
          && existing.action === entry.action);
        if (index <= -1) {
          uniqueRecords.push(entry);
        }
        return false;
      });

    if (uniqueRecords.length) {
      uniqueRecords.forEach(async (record) => {
        submitCustomAction(`${record.group} - ${record.intensity}`, record.action);
      });
      bulkImport(uniqueRecords);
    } else {
      return setSubmitMessage({
        type: 'error',
        message: t('ctNoNewError'),
      });
    }

    return exportData();
  }

  const copyToClipboard = () => navigator.clipboard.writeText(inputValue);

  useEffect(() => {
    if (expanded === 'ctImport') {
      exportData();
    }
  }, [expanded, customTiles]);

  return (
    <Accordion expanded={expanded === 'ctImport'} onChange={handleChange('ctImport')}>
      <AccordionSummary aria-controls="ctImport-content" id="ctImport-header">
        <Typography><Trans i18nKey="importExport" /></Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body1" sx={{ mb: 2 }}><Trans i18nKey="ctImportDescription" /></Typography>
        <Box
          component="form"
          method="post"
          ref={formData}
        >
          <TextField
            id="importData"
            name="importData"
            multiline
            required
            fullWidth
            sx={{ pb: 2 }}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            InputProps={{
              endAdornment: (
                <Tooltip title={t('copyToClipboard')}>
                  <IconButton onClick={copyToClipboard}>
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              ),
              sx: { alignItems: 'flex-start' },
            }}
          />

          <Button fullWidth variant="contained" type="button" onClick={(event) => importTiles(event)}>
            <Trans i18nKey="import" />
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
