import { Box, Button, TextField, Typography } from '@mui/material';
import { submitCustomAction } from '@/services/firebase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Accordion from '@/components/Accordion';
import AccordionSummary from '@/components/Accordion/Summary';
import AccordionDetails from '@/components/Accordion/Details';
import CopyToClipboard from '@/components/CopyToClipboard';
import getUniqueImportRecords from './getUniqueImportRecords';
import { updateCustomTile } from '@/stores/customTiles';
import groupActionsFolder from '@/helpers/actionsFolder';
import { ImportExportProps, CustomTile } from '@/types/customTiles';

export default function ImportExport({
  expanded,
  handleChange,
  customTiles,
  mappedGroups,
  setSubmitMessage,
  bulkImport,
}: ImportExportProps) {
  const formData = useRef<HTMLFormElement | null>(null);
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState<string>('');

  const exportData = useCallback(() => {
    const userCustomTiles = customTiles.filter((tile) => tile.isCustom);

    const customString = userCustomTiles.map(
      ({ group, intensity, action, tags, gameMode = 'online' }) => {
        // Get the appropriate groups for this tile's game mode
        const gameModeGroups = groupActionsFolder(
          mappedGroups[gameMode as keyof typeof mappedGroups] || {}
        );

        // Find the matching group data
        const userData = gameModeGroups.find(
          (entry) => entry?.intensity === Number(intensity) && entry?.value === group
        );

        let actionText = '';
        actionText += `[${userData?.group || group} - ${userData?.translatedIntensity || intensity}]\n`;
        actionText += action;
        actionText += tags?.length ? `\nTags: ` + tags?.join(', ') : '';
        actionText += `\nGameMode: ${gameMode}`;

        return actionText;
      }
    );

    setInputValue(customString.join('\n---\n'));
  }, [customTiles, mappedGroups, setInputValue]);

  async function importTiles(formRef: React.RefObject<HTMLFormElement | null>) {
    if (!formRef.current) return;

    const form = formRef.current as unknown as { importData: HTMLInputElement };
    const importDataValue = form.importData.value;

    let uniqueRecords: CustomTile[] = [];
    let changedRecords: CustomTile[] = [];

    try {
      const { newUniqueRecords, changedTagRecords } = getUniqueImportRecords(
        importDataValue,
        customTiles,
        mappedGroups
      );
      uniqueRecords = newUniqueRecords;
      changedRecords = changedTagRecords;
    } catch (error: any) {
      if (error instanceof Error) {
        return setSubmitMessage({
          type: 'error',
          message: t(error.message),
        });
      }
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
      await Promise.all(
        changedRecords.map(async (record) => {
          if (record.id !== undefined) {
            await updateCustomTile(record.id, record);
          }
        })
      );
    }

    return exportData();
  }

  useEffect(() => {
    if (expanded === 'ctImport') {
      exportData();
    }
  }, [expanded, customTiles, exportData]);

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
