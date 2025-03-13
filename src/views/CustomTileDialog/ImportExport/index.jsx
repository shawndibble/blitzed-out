import { Box, Button, TextField, Typography } from '@mui/material';
import { submitCustomAction } from '@/services/firebase';
import { useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Accordion from '@/components/Accordion';
import AccordionSummary from '@/components/Accordion/Summary';
import AccordionDetails from '@/components/Accordion/Details';
import CopyToClipboard from '@/components/CopyToClipboard';
import getUniqueImportRecords from './getUniqueImportRecords';
import { updateCustomTile } from '@/stores/customTiles';

export default function ImportExport({
  expanded,
  handleChange,
  customTiles,
  mappedGroups,
  setSubmitMessage,
  bulkImport,
}) {
  const formData = useRef();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  const exportData = () => {
    const userCustomTiles = customTiles.filter(tile => tile.isCustom);
    
    const customString = userCustomTiles.map(({ group, intensity, action, tags }) => {
      const userData = mappedGroups.find(
        (entry) => entry?.intensity === Number(intensity) && entry?.value === group
      );
      let actionText = '';
      actionText += `[${userData?.group} - ${userData?.translatedIntensity}]\n`;
      actionText += action;
      actionText += tags?.length ? `\nTags: ` + tags?.join(', ') : '';

      return actionText;
    });

    setInputValue(customString.join('\n---\n'));
  };

  async function importTiles(formData) {
    const { importData } = formData.current;
    let uniqueRecords = [];
    let changedRecords = [];

    try {
      const { newUniqueRecords, changedTagRecords } = getUniqueImportRecords(
        importData.value,
        customTiles,
        mappedGroups
      );
      uniqueRecords = newUniqueRecords;
      changedRecords = changedTagRecords;
    } catch (error) {
      return setSubmitMessage({
        type: 'error',
        message: t(error.message),
      });
    }

    if (!uniqueRecords.length && !changedRecords.length) {
      return setSubmitMessage({
        type: 'error',
        message: t('ctNoNewError'),
      });
    }

    if (uniqueRecords.length) {
      uniqueRecords.forEach(async (record) => {
        submitCustomAction(`${record.group} - ${record.intensity}`, record.action);
      });
      bulkImport(uniqueRecords);
    }

    if (changedRecords.length) {
      await changedRecords.forEach(async (record) => {
        await updateCustomTile(record.id, record);
      });
    }

    return exportData();
  }

  useEffect(() => {
    if (expanded === 'ctImport') {
      exportData();
    }
  }, [expanded, customTiles]);

  return (
    <Accordion expanded={expanded === 'ctImport'} onChange={handleChange('ctImport')}>
      <AccordionSummary aria-controls="ctImport-content" id="ctImport-header">
        <Typography>
          <Trans i18nKey="importExport" />
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <Trans i18nKey="ctImportDescription" />
        </Typography>
        <Box component="form" method="post" ref={formData}>
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
              endAdornment: <CopyToClipboard text={inputValue} />,
              sx: { alignItems: 'flex-start' },
            }}
          />
          <Button fullWidth variant="contained" type="button" onClick={() => importTiles(formData)}>
            <Trans i18nKey="import" />
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
