import {
  Alert,
  Box,
  Button,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { JSX, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ActionCard from './ActionCard';
import AddActionsDialog from './AddActionsDialog';
import ContentWarning from '../BoardSettings/ContentWarning';
import FinishRangeRow from './FinishRangeRow';
import WarningAlert from '../BoardSettings/WarningAlert';
import { groupUsesRoleTokens } from '@/helpers/actionsFolder';
import { usesSoloActions } from '@/helpers/strings';
import { ActionEntry } from '@/types';
import { Settings } from '@/types/Settings';

interface ActionsSectionProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  actionsList: Record<string, any>;
  /** Picker visibility is lifted so the page header's "+ Add" can open it too. */
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  /** Opens the custom-tile manager; the dialog lives on the settings page. */
  onManageCustomTiles: () => void;
}

/**
 * Loadout-style action selection: only enabled groups render as full cards;
 * the whole catalog (which grows with content packs) lives behind one
 * searchable Add dialog. The page stays a handful of cards at any catalog size.
 */
export default function ActionsSection({
  formData,
  setFormData,
  actionsList,
  pickerOpen,
  onPickerOpenChange,
  onManageCustomTiles,
}: ActionsSectionProps): JSX.Element {
  const { t } = useTranslation();
  const [removed, setRemoved] = useState<{ key: string; entry: ActionEntry } | null>(null);

  const soloActions = usesSoloActions(formData.gameMode, formData.soloPlay);
  const pickableTypes = useMemo(
    () => (soloActions ? ['consumption', 'solo'] : ['consumption', 'foreplay', 'sex']),
    [soloActions]
  );

  const availableGroups = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(actionsList).filter(([, group]) =>
          pickableTypes.includes((group as any)?.type)
        )
      ),
    [actionsList, pickableTypes]
  );

  const enabledKeys = Object.keys(formData.selectedActions ?? {});
  const catalogRemaining = Object.keys(availableGroups).filter(
    (key) => !enabledKeys.includes(key)
  ).length;

  const writeEntry = (groupKey: string, entry: ActionEntry): void => {
    setFormData({
      ...formData,
      selectedActions: { ...formData.selectedActions, [groupKey]: entry },
      boardUpdated: true,
    });
  };

  const handleLevelsChange = (groupKey: string, levels: number[]): void => {
    const existing = formData.selectedActions?.[groupKey];
    writeEntry(groupKey, {
      ...existing,
      type: existing?.type ?? (actionsList[groupKey]?.type || 'foreplay'),
      levels,
    });
  };

  const handleFieldChange = (
    groupKey: string,
    field: 'role' | 'variation',
    value: string
  ): void => {
    const existing = formData.selectedActions?.[groupKey];
    writeEntry(groupKey, {
      ...existing,
      type: existing?.type ?? (actionsList[groupKey]?.type || 'foreplay'),
      levels: existing?.levels ?? [],
      [field]: value,
    });
  };

  const handleAdd = (groupKey: string): void => {
    const group = availableGroups[groupKey];
    const firstLevel = Object.keys(group?.intensities ?? {})
      .map(Number)
      .sort((a, b) => a - b)[0];
    writeEntry(groupKey, {
      type: group?.type || 'foreplay',
      levels: firstLevel ? [firstLevel] : [],
    });
  };

  const handleRemove = (groupKey: string): void => {
    const entry = formData.selectedActions?.[groupKey];
    if (!entry) return;
    const { [groupKey]: _removedEntry, ...rest } = formData.selectedActions ?? {};
    setFormData({ ...formData, selectedActions: rest, boardUpdated: true });
    setRemoved({ key: groupKey, entry });
  };

  const handleUndoRemove = (): void => {
    if (removed) writeEntry(removed.key, removed.entry);
    setRemoved(null);
  };

  const handleParticipationChange = (_: unknown, value: string | null): void => {
    if (!value) return;
    setFormData({ ...formData, soloPlay: value === 'solo', boardUpdated: true });
  };

  const modeBannerKey =
    formData.gameMode === 'local'
      ? 'actionsBannerSharedDevice'
      : soloActions
        ? 'actionsBannerSolo'
        : 'actionsBannerTogether';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {formData.gameMode === 'online' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('participation')}
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={soloActions ? 'solo' : 'together'}
            onChange={handleParticipationChange}
            aria-label={t('participation')}
          >
            <ToggleButton value="together">{t('participationTogether')}</ToggleButton>
            <ToggleButton value="solo">{t('participationSolo')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      <Alert severity="info" variant="outlined" sx={{ py: 0.25 }}>
        {t(modeBannerKey)}
      </Alert>

      {enabledKeys.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
          {t('noActionsEnabled')}
        </Typography>
      )}

      {enabledKeys.map((groupKey) => {
        const group = actionsList[groupKey];
        const entry = formData.selectedActions?.[groupKey];
        if (!entry) return null;
        const unavailable = !group || !pickableTypes.includes(group?.type);
        return (
          <ActionCard
            key={groupKey}
            groupKey={groupKey}
            group={group ?? { label: groupKey }}
            entry={entry}
            unavailable={unavailable}
            showRole={formData.gameMode === 'online' && !soloActions && groupUsesRoleTokens(group)}
            onLevelsChange={handleLevelsChange}
            onFieldChange={handleFieldChange}
            onRemove={handleRemove}
          />
        );
      })}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        <Button
          startIcon={<AddIcon />}
          onClick={() => onPickerOpenChange(true)}
          sx={{
            flex: 1,
            border: '1px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            py: 1.1,
            opacity: 0.9,
          }}
        >
          {t('addActions')}
          {catalogRemaining > 0 && ` · ${t('moreAvailable', { count: catalogRemaining })}`}
        </Button>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={onManageCustomTiles}
          sx={{ flexShrink: 0 }}
        >
          {t('customTilesLabel')}
        </Button>
      </Box>

      <FinishRangeRow formData={formData} setFormData={setFormData} />
      <WarningAlert formData={formData} />
      <ContentWarning formData={formData} actionsList={actionsList} />

      <AddActionsDialog
        open={pickerOpen}
        onClose={() => onPickerOpenChange(false)}
        availableGroups={availableGroups}
        enabledKeys={enabledKeys}
        onAdd={handleAdd}
      />

      <Snackbar
        open={!!removed}
        autoHideDuration={6000}
        onClose={() => setRemoved(null)}
        message={
          removed
            ? t('removedAction', { label: actionsList[removed.key]?.label || removed.key })
            : ''
        }
        action={
          <Button color="primary" size="small" onClick={handleUndoRemove}>
            {t('undo')}
          </Button>
        }
      />
    </Box>
  );
}
