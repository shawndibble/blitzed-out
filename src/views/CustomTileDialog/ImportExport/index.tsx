import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { submitCustomAction } from '@/services/firebase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Accordion from '@/components/Accordion';
import AccordionSummary from '@/components/Accordion/Summary';
import AccordionDetails from '@/components/Accordion/Details';
import CopyToClipboard from '@/components/CopyToClipboard';
import groupActionsFolder from '@/helpers/actionsFolder';
import { ImportExportProps } from '@/types/customTiles';
import { exportEnhancedData, autoImportData, ImportResult } from './enhancedImportExport';
import { useGameSettings } from '@/stores/settingsStore';

export default function ImportExport({
  expanded,
  handleChange,
  customTiles,
  mappedGroups,
  setSubmitMessage,
  bulkImport: _bulkImport,
}: ImportExportProps) {
  const formData = useRef<HTMLFormElement | null>(null);
  const { t } = useTranslation();
  const { settings } = useGameSettings();
  const [inputValue, setInputValue] = useState<string>('');
  // const [selectedTab, setSelectedTab] = useState(0); // Removed as tabs not implemented yet
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportFormat, setExportFormat] = useState<'enhanced' | 'legacy'>('enhanced');
  const [mergeStrategy, setMergeStrategy] = useState<'skip' | 'overwrite' | 'rename'>('skip');

  const exportData = useCallback(async () => {
    try {
      if (exportFormat === 'enhanced') {
        // Use the new enhanced export format
        const enhancedData = await exportEnhancedData(
          settings.locale || 'en',
          settings.gameMode || 'online'
        );
        setInputValue(enhancedData);
      } else {
        // Use the legacy export format
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
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setSubmitMessage({
        message: `Export failed: ${error}`,
        type: 'error',
      });
    }
  }, [
    customTiles,
    mappedGroups,
    setInputValue,
    exportFormat,
    settings.locale,
    settings.gameMode,
    setSubmitMessage,
  ]);

  async function importTiles(formRef: React.RefObject<HTMLFormElement | null>) {
    if (!formRef.current) return;

    const form = formRef.current as unknown as { importData: HTMLInputElement };
    const importDataValue = form.importData.value;

    if (!importDataValue.trim()) {
      return setSubmitMessage({
        type: 'error',
        message: t('Please enter data to import'),
      });
    }

    try {
      setSubmitMessage({ type: 'info', message: 'Importing data...' });

      // Use the new auto-import function that detects format
      const result = await autoImportData(importDataValue, mappedGroups, {
        locale: settings.locale || 'en',
        gameMode: settings.gameMode || 'online',
        mergeStrategy,
      });

      setImportResult(result);

      if (result.success) {
        // Submit custom actions for tracking if tiles were imported
        if (result.importedTiles > 0) {
          const customTilesFromImport = await import('@/stores/customTiles').then((module) =>
            module.getTiles({ isCustom: 1 })
          );

          // Submit the most recent tiles (simplified approach)
          customTilesFromImport.slice(-result.importedTiles).forEach(async (record) => {
            submitCustomAction(`${record.group} - ${record.intensity}`, record.action);
          });
        }

        let message = 'Import completed successfully!';
        if (result.importedGroups > 0) {
          message += ` Imported ${result.importedGroups} custom groups.`;
        }
        if (result.importedTiles > 0) {
          message += ` Imported ${result.importedTiles} custom tiles.`;
        }

        setSubmitMessage({
          type: 'success',
          message,
        });

        // Refresh the export data to show the new content
        await exportData();
      } else {
        setSubmitMessage({
          type: 'error',
          message: `Import failed: ${result.errors.join(', ')}`,
        });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setSubmitMessage({
        type: 'error',
        message: `Import failed: ${error.message || error}`,
      });
      setImportResult(null);
    }
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

        {/* Export Format Selection */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Export Format
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'enhanced' | 'legacy')}
              label="Format"
            >
              <MenuItem value="enhanced">Enhanced (v2.0)</MenuItem>
              <MenuItem value="legacy">Legacy</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
            Enhanced format includes custom groups. Legacy format is for backward compatibility.
          </Typography>
        </Box>

        {/* Import Merge Strategy */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Import Strategy
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Strategy</InputLabel>
            <Select
              value={mergeStrategy}
              onChange={(e) => setMergeStrategy(e.target.value as 'skip' | 'overwrite' | 'rename')}
              label="Strategy"
            >
              <MenuItem value="skip">Skip Existing</MenuItem>
              <MenuItem value="overwrite">Overwrite</MenuItem>
              <MenuItem value="rename">Rename Conflicts</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
            How to handle items that already exist during import.
          </Typography>
        </Box>

        <Box component="form" method="post" ref={formData}>
          <TextField
            id="importData"
            name="importData"
            multiline
            required
            fullWidth
            rows={6}
            sx={{ pb: 2 }}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={
              exportFormat === 'enhanced'
                ? 'Paste enhanced format JSON data here...'
                : 'Paste legacy format data here...'
            }
            InputProps={{
              endAdornment: <CopyToClipboard text={inputValue} />,
              sx: { alignItems: 'flex-start' },
            }}
          />

          {/* Import Result Display */}
          {importResult && (
            <Alert
              severity={importResult.success ? 'success' : 'error'}
              sx={{ mb: 2 }}
              onClose={() => setImportResult(null)}
            >
              <Typography variant="body2">
                <strong>Import Results:</strong>
              </Typography>
              {importResult.importedGroups > 0 && (
                <Typography variant="body2">
                  • {importResult.importedGroups} custom groups imported
                </Typography>
              )}
              {importResult.importedTiles > 0 && (
                <Typography variant="body2">
                  • {importResult.importedTiles} custom tiles imported
                </Typography>
              )}
              {importResult.warnings.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="warning.main">
                    <strong>Warnings:</strong>
                  </Typography>
                  {importResult.warnings.map((warning, index) => (
                    <Typography key={index} variant="body2" color="warning.main">
                      • {warning}
                    </Typography>
                  ))}
                </Box>
              )}
              {importResult.errors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="error.main">
                    <strong>Errors:</strong>
                  </Typography>
                  {importResult.errors.map((error, index) => (
                    <Typography key={index} variant="body2" color="error.main">
                      • {error}
                    </Typography>
                  ))}
                </Box>
              )}
            </Alert>
          )}

          <Button fullWidth variant="contained" type="button" onClick={() => importTiles(formData)}>
            <Trans i18nKey="import" />
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
