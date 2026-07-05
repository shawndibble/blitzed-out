import { Box, Button, Snackbar, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { JSX, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ActionCard from './ActionCard';
import AddActionsDialog from './AddActionsDialog';
import ContentWarning from '../BoardSettings/ContentWarning';
import FinishSlider from '../BoardSettings/FinishSlider';
import WarningAlert from '../BoardSettings/WarningAlert';
import { groupUsesRoleTokens } from '@/helpers/actionsFolder';
import { usesSoloActions } from '@/helpers/strings';
import { ActionEntry } from '@/types';
import { Settings } from '@/types/Settings';

interface ActionsSectionProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  actionsList: Record<string, any>;
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
}: ActionsSectionProps): JSX.Element {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
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

      {formData.gameMode === 'local' && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('sharedDeviceActionsHint')}
        </Typography>
      )}

      {enabledKeys.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
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

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => setPickerOpen(true)}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('addActions')}
        {catalogRemaining > 0 && ` · ${t('moreAvailable', { count: catalogRemaining })}`}
      </Button>

      <FinishSlider setFormData={setFormData} formData={formData} />
      <WarningAlert formData={formData} />
      <ContentWarning formData={formData} actionsList={actionsList} />

      <AddActionsDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
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
