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
import {
  exportCleanData,
  exportGroupData,
  autoImportData,
  ImportResult,
  getAvailableGroupsForExport,
} from './enhancedImportExport';
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
  const [exportFormat, setExportFormat] = useState<'clean' | 'legacy'>('clean');
  const [exportScope, setExportScope] = useState<'all' | 'single' | 'default'>('all');
  const [singleGroup, setSingleGroup] = useState<string>('');
  const [availableGroups, setAvailableGroups] = useState<
    { name: string; label: string; tileCount: number }[]
  >([]);
  const [mergeStrategy, setMergeStrategy] = useState<'skip' | 'overwrite' | 'rename'>('skip');

  const exportData = useCallback(async () => {
    try {
      if (exportFormat === 'clean') {
        let exportedData: string;

        switch (exportScope) {
          case 'single':
            if (!singleGroup) {
              setSubmitMessage({
                message: t('errors.selectGroupToExport'),
                type: 'error',
              });
              return;
            }
            exportedData = await exportGroupData(singleGroup, settings.locale || 'en');
            break;
          case 'default':
            exportedData = await exportCleanData(settings.locale || 'en', {
              exportScope: 'default',
            });
            break;
          case 'all':
          default:
            exportedData = await exportCleanData(settings.locale || 'en', { exportScope: 'all' });
            break;
        }

        setInputValue(exportedData);
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
        message: t('errors.exportFailed', { error: error }),
        type: 'error',
      });
    }
  }, [
    customTiles,
    mappedGroups,
    setInputValue,
    exportFormat,
    exportScope,
    singleGroup,
    settings.locale,
    setSubmitMessage,
    t,
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
      setSubmitMessage({ type: 'info', message: t('messages.importing') });

      // Use the new auto-import function that detects format
      const result = await autoImportData(importDataValue, mappedGroups, {
        locale: settings.locale || 'en',
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

        let message: string = t('messages.importSuccess');
        if (result.importedGroups > 0) {
          message += ` ${t('messages.importedGroups', { count: result.importedGroups })}`;
        }
        if (result.importedTiles > 0) {
          message += ` ${t('messages.importedTiles', { count: result.importedTiles })}`;
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
          message: t('errors.importFailed', { errors: result.errors.join(', ') }),
        });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setSubmitMessage({
        type: 'error',
        message: t('errors.importFailed', { errors: error.message || error }),
      });
      setImportResult(null);
    }
  }

  // Load available groups when component opens
  const loadAvailableGroups = useCallback(async () => {
    try {
      const groups = await getAvailableGroupsForExport(settings.locale || 'en');
      setAvailableGroups(groups);
    } catch (error) {
      console.error('Error loading available groups:', error);
    }
  }, [settings.locale]);

  useEffect(() => {
    if (expanded === 'ctImport') {
      loadAvailableGroups();
      exportData();
    }
  }, [expanded, customTiles, exportData, loadAvailableGroups]);

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

        {/* Compact Select Box Layout */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
            '& .MuiFormControl-root': {
              minWidth: 150,
              flex: '1 1 auto',
            },
          }}
        >
          {/* Export Format Selection */}
          <FormControl size="small">
            <InputLabel>{t('labels.exportFormat')}</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'clean' | 'legacy')}
              label={t('labels.exportFormat')}
            >
              <MenuItem value="clean">{t('exportFormat.clean')}</MenuItem>
              <MenuItem value="legacy">{t('exportFormat.legacy')}</MenuItem>
            </Select>
          </FormControl>

          {/* Export Scope Selection */}
          {exportFormat === 'clean' && (
            <FormControl size="small">
              <InputLabel>{t('labels.exportScope')}</InputLabel>
              <Select
                value={exportScope}
                onChange={(e) => {
                  setExportScope(e.target.value as 'all' | 'single' | 'default');
                  // Reset selection when scope changes
                  setSingleGroup('');
                }}
                label={t('labels.exportScope')}
              >
                <MenuItem value="all">{t('exportScope.all')}</MenuItem>
                <MenuItem value="default">{t('exportScope.default')}</MenuItem>
                <MenuItem value="single">{t('exportScope.single')}</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Import Merge Strategy */}
          <FormControl size="small">
            <InputLabel>{t('labels.importStrategy')}</InputLabel>
            <Select
              value={mergeStrategy}
              onChange={(e) => setMergeStrategy(e.target.value as 'skip' | 'overwrite' | 'rename')}
              label={t('labels.importStrategy')}
            >
              <MenuItem value="skip">{t('importStrategy.skip')}</MenuItem>
              <MenuItem value="overwrite">{t('importStrategy.overwrite')}</MenuItem>
              <MenuItem value="rename">{t('importStrategy.rename')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Single Group Selection - Only show when needed */}
        {exportFormat === 'clean' && exportScope === 'single' && (
          <Box sx={{ mb: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>{t('labels.selectGroup')}</InputLabel>
              <Select
                value={singleGroup}
                onChange={(e) => setSingleGroup(e.target.value)}
                label={t('labels.selectGroup')}
              >
                {availableGroups.map((group) => (
                  <MenuItem key={group.name} value={group.name}>
                    {group.label} ({group.tileCount} tiles)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

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
              exportFormat === 'clean'
                ? t('placeholder.cleanFormat')
                : t('placeholder.legacyFormat')
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
                <strong>
                  <Trans i18nKey="importResults.title" />
                </strong>
              </Typography>
              {importResult.importedGroups > 0 && (
                <Typography variant="body2">
                  •{' '}
                  <Trans
                    i18nKey="importResults.groupsImported"
                    values={{ count: importResult.importedGroups }}
                  />
                </Typography>
              )}
              {importResult.importedTiles > 0 && (
                <Typography variant="body2">
                  •{' '}
                  <Trans
                    i18nKey="importResults.tilesImported"
                    values={{ count: importResult.importedTiles }}
                  />
                </Typography>
              )}
              {importResult.warnings.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="warning.main">
                    <strong>
                      <Trans i18nKey="importResults.warnings" />
                    </strong>
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
                    <strong>
                      <Trans i18nKey="importResults.errors" />
                    </strong>
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

        {/* Format Guide - Collapsed by default */}
        {exportFormat === 'clean' && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary>
              <Typography variant="subtitle2">
                <Trans i18nKey="formatGuide.title" />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <Trans i18nKey="formatGuide.description" />
              </Typography>

              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                <Trans i18nKey="formatGuide.keySections" />
              </Typography>
              <Typography variant="body2" component="div" sx={{ mb: 2, ml: 2 }}>
                <Trans
                  i18nKey="formatGuide.keySectionsContent"
                  components={{
                    strong1: <strong />,
                    strong2: <strong />,
                    br: <br />,
                  }}
                />
              </Typography>

              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                <Trans i18nKey="formatGuide.manualEditing" />
              </Typography>
              <Typography variant="body2" component="div" sx={{ mb: 2, ml: 2 }}>
                <Trans
                  i18nKey="formatGuide.manualEditingContent"
                  components={{
                    br: <br />,
                  }}
                />
              </Typography>

              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                <Trans i18nKey="formatGuide.customTilesFormat" />
              </Typography>
              <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                <Trans
                  i18nKey="formatGuide.customTilesFormatContent"
                  components={{
                    br: <br />,
                    code1: <code />,
                    code2: <code />,
                  }}
                />
              </Typography>
            </AccordionDetails>
          </Accordion>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
