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
import { useCallback, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Accordion from '@/components/Accordion';
import AccordionSummary from '@/components/Accordion/Summary';
import AccordionDetails from '@/components/Accordion/Details';
import CopyToClipboard from '@/components/CopyToClipboard';
import { ImportExportProps } from '@/types/customTiles';
import { ImportResult } from '@/types/importExport';
import { exportAllData, importData } from '@/services/importExport';
import { getExportableGroupStats } from '@/services/importExport/exportService';
import { batchFetchGroups } from '@/services/importExport/databaseOperations';
import {
  exportSingleGroup,
  exportCustomData,
  exportDisabledDefaults,
} from './enhancedImportExport';
import { useGameSettings } from '@/stores/settingsStore';
import { getCustomGroups } from '@/stores/customGroups';
import { submitCustomAction } from '@/services/firebase';
import { getTiles } from '@/stores/customTiles';

export default function ImportExport({
  expanded,
  handleChange,
  customTiles,
  mappedGroups: _mappedGroups,
  setSubmitMessage,
  bulkImport: _bulkImport,
  onImportSuccess,
}: ImportExportProps) {
  const formData = useRef<HTMLFormElement | null>(null);
  const { t } = useTranslation();
  const { settings } = useGameSettings();
  const [inputValue, setInputValue] = useState<string>('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportScope, setExportScope] = useState<'all' | 'custom' | 'single' | 'disabled'>('all');
  const [singleGroup, setSingleGroup] = useState<string>('');
  const [availableGroups, setAvailableGroups] = useState<
    {
      name: string;
      label: string;
      exportCount: {
        total: number;
        customGroups: number;
        customTiles: number;
        disabledDefaults: number;
      };
    }[]
  >([]);
  const [groupIdMap, setGroupIdMap] = useState<Map<string, string>>(new Map());

  // Helper function to format export count breakdown
  const formatExportBreakdown = (exportCount: {
    customGroups: number;
    customTiles: number;
    disabledDefaults: number;
  }) => {
    const parts: string[] = [];

    if (exportCount.customGroups > 0) {
      parts.push(
        `${exportCount.customGroups} ${exportCount.customGroups === 1 ? 'group' : 'groups'}`
      );
    }

    if (exportCount.customTiles > 0) {
      parts.push(`${exportCount.customTiles} ${exportCount.customTiles === 1 ? 'tile' : 'tiles'}`);
    }

    if (exportCount.disabledDefaults > 0) {
      parts.push(`${exportCount.disabledDefaults} disabled`);
    }

    return parts.length > 0 ? `(${parts.join(', ')})` : '';
  };

  const exportData = useCallback(async () => {
    try {
      let exportedData: string;
      const locale = settings.locale || 'en';
      const gameMode = settings.gameMode || 'online';

      switch (exportScope) {
        case 'single':
          if (!singleGroup) {
            setSubmitMessage({
              message: t('errors.selectGroupToExport'),
              type: 'error',
            });
            return;
          }
          exportedData = await exportSingleGroup(singleGroup, locale, gameMode);
          break;
        case 'custom':
          exportedData = await exportCustomData(locale, gameMode);
          break;
        case 'disabled':
          exportedData = await exportDisabledDefaults(locale, gameMode);
          break;
        default: // 'all'
          exportedData = await exportAllData({
            includeDisabledDefaults: true,
          });
          break;
      }

      setInputValue(exportedData);
      setSubmitMessage({
        message: 'Export successful!',
        type: 'success',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setSubmitMessage({
        message: `Export failed: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error',
      });
    }
  }, [exportScope, singleGroup, settings.locale, settings.gameMode, setSubmitMessage, t]);

  async function importTiles(formRef: React.RefObject<HTMLFormElement | null>) {
    if (!formRef.current) return;

    const form = formRef.current as unknown as { importData: HTMLInputElement };
    const importDataValue = form.importData.value;

    if (!importDataValue.trim()) {
      return setSubmitMessage({
        type: 'error',
        message: t('enterDataToImport'),
      });
    }

    try {
      setSubmitMessage({ type: 'info', message: 'Importing data...' });

      // Use the new import system
      const result = await importData(importDataValue, {
        validateContent: true,
        preserveDisabledDefaults: true,
      });

      setImportResult(result);

      if (result.success) {
        // Submit custom actions for tracking if tiles were imported
        if (result.importedTiles > 0) {
          const customTilesFromImport = await getTiles({ isCustom: 1 });

          // Get groups to resolve group names for Firebase submission
          const allGroups = await getCustomGroups({});
          const groupMap = new Map(allGroups.map((group) => [group.id, group]));

          // Submit the most recent tiles (simplified approach)
          customTilesFromImport.slice(-result.importedTiles).forEach(async (record) => {
            const group = groupMap.get(record.group_id || '');
            const groupName = group?.name || 'Unknown Group';
            const intensityData = group?.intensities.find((i) => i.value === record.intensity);
            const intensityLabel = intensityData?.label || `Level ${record.intensity + 1}`;

            submitCustomAction(`${groupName} - ${intensityLabel}`, record.action);
          });
        }

        let message: string = 'Import successful!';
        if (result.importedGroups > 0) {
          message += ` Imported ${result.importedGroups} groups.`;
        }
        if (result.importedTiles > 0) {
          message += ` Imported ${result.importedTiles} tiles.`;
        }
        if (result.importedDisabledDefaults > 0) {
          message += ` Imported ${result.importedDisabledDefaults} disabled defaults.`;
        }
        if (result.skippedItems > 0) {
          message += ` Skipped ${result.skippedItems} items.`;
        }

        setSubmitMessage({
          type: 'success',
          message,
        });

        // Refresh the export data to show the new content
        await exportData();

        // Trigger ViewCustomTiles refresh
        onImportSuccess?.();
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

  // Load available groups when component opens
  const loadAvailableGroups = useCallback(async () => {
    try {
      // For single group exports, always include disabled defaults in the count
      const shouldIncludeDisabled = exportScope === 'single' || exportScope === 'all';

      // Fetch all groups to create ID mapping
      const allGroups = await batchFetchGroups(settings.locale || 'en', 'online');
      const idMap = new Map();
      allGroups.forEach((group) => {
        idMap.set(group.name, group.id);
      });
      setGroupIdMap(idMap);

      const groupStats = await getExportableGroupStats(
        settings.locale || 'en',
        'online',
        shouldIncludeDisabled,
        exportScope
      );
      setAvailableGroups(groupStats);
    } catch (error) {
      console.error('Error loading available groups:', error);
    }
  }, [settings.locale, exportScope]);

  useEffect(() => {
    if (expanded === 'ctImport') {
      loadAvailableGroups();
      exportData();
    }
  }, [expanded, customTiles, exportData, loadAvailableGroups, exportScope]);

  return (
    <Accordion
      expanded={expanded === 'ctImport'}
      onChange={handleChange('ctImport')}
      className="about-accordion"
    >
      <AccordionSummary aria-controls="ctImport-content" id="ctImport-header">
        <Typography className="accordion-title">
          <Trans i18nKey="importExport" />
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box component="form" method="post" className="settings-box" ref={formData}>
          {/* Export Scope */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('export.scope')}</InputLabel>
            <Select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value as any)}
              label={t('export.scope')}
            >
              <MenuItem value="all">{t('exportScope.all')}</MenuItem>
              <MenuItem value="custom">{t('exportScope.custom')}</MenuItem>
              <MenuItem value="single">{t('exportScope.single')}</MenuItem>
              <MenuItem value="disabled">{t('exportScope.disabled')}</MenuItem>
            </Select>
          </FormControl>

          {/* Single Group Selector */}
          {exportScope === 'single' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('export.selectGroup')}</InputLabel>
              <Select
                value={singleGroup}
                onChange={(e) => setSingleGroup(e.target.value)}
                label={t('export.selectGroup')}
              >
                {availableGroups.map((group, index) => (
                  <MenuItem
                    key={
                      groupIdMap.get(group.name) ||
                      `${group.name}-${settings.locale}-${settings.gameMode}-${index}`
                    }
                    value={group.name}
                  >
                    {group.label} {formatExportBreakdown(group.exportCount)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            name="importData"
            label={t('importExport')}
            multiline
            rows={8}
            fullWidth
            variant="outlined"
            placeholder={t('placeholder.importData')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant="contained" onClick={() => importTiles(formData)}>
              {t('import')}
            </Button>

            <CopyToClipboard text={inputValue} />
          </Box>

          {/* Import Results */}
          {importResult && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={importResult.success ? 'success' : 'error'}>
                {importResult.success
                  ? t('importMessages.importSuccess')
                  : t('importMessages.importFailed')}
              </Alert>

              {importResult.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Typography variant="subtitle2">Warnings:</Typography>
                  {importResult.warnings.map((warning, index) => (
                    <Typography key={index} variant="body2">
                      • {warning}
                    </Typography>
                  ))}
                </Alert>
              )}

              {importResult.errors.length > 0 && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  <Typography variant="subtitle2">Errors:</Typography>
                  {importResult.errors.map((error, index) => (
                    <Typography key={index} variant="body2">
                      • {error}
                    </Typography>
                  ))}
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
