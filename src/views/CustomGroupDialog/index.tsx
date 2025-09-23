import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Tab,
  Tabs,
} from '@mui/material';
import { nanoid } from 'nanoid';
import { useTranslation } from 'react-i18next';
import {
  CustomGroupDialogProps,
  CustomGroupBase,
  CustomGroupIntensity,
  CustomGroupPull,
  DEFAULT_INTENSITY_TEMPLATES,
} from '@/types/customGroups';
import { validateCustomGroup } from '@/services/validationService';
import { GroupType, VALID_GROUP_TYPES } from '@/types';
import {
  addCustomGroup,
  updateCustomGroup,
  deleteCustomGroup,
  getCustomGroups,
} from '@/stores/customGroups';
import { countTilesByGroup, deleteCustomTilesByGroup } from '@/stores/customTiles';
import CreateEditTab from './CreateEditTab';
import ManageTab from './ManageTab';
import DeleteDialog from './DeleteDialog';
import { FormState, DialogState } from './types';

// Helper function to find matching template index
const findMatchingTemplateIndex = (intensities: CustomGroupIntensity[]) => {
  const matchingTemplateIndex = DEFAULT_INTENSITY_TEMPLATES.findIndex(
    (template) => template.intensities.length === intensities.length
  );
  return matchingTemplateIndex >= 0 ? matchingTemplateIndex : 0; // Default to Simple (1-3) template
};

export default function CustomGroupDialog({
  open,
  onClose,
  onGroupCreated,
  onGroupUpdated,
  editingGroup,
  locale,
  gameMode,
}: CustomGroupDialogProps) {
  const { t } = useTranslation();

  // Consolidated state management
  const [formState, setFormState] = useState<FormState>({
    label: '',
    type: '',
    localGameMode: gameMode,
    selectedTemplateIndex: 0,
    intensityLabels: [
      t('intensityLabels.beginner'),
      t('intensityLabels.intermediate'),
      t('intensityLabels.advanced'),
    ],
  });

  const [dialogState, setDialogState] = useState<DialogState>({
    selectedTab: 0,
    isLoading: true,
    currentEditingGroup: null,
    validation: { isValid: true, errors: [] },
    isSubmitting: false,
  });

  // Data state
  const [existingGroups, setExistingGroups] = useState<CustomGroupPull[]>([]);
  const [tileCounts, setTileCounts] = useState<Record<string, number>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<{
    id: string;
    name: string;
    tileCount: number;
  } | null>(null);

  // Reload groups and tile counts
  const reloadGroupsAndCounts = useCallback(async () => {
    try {
      // Get all custom groups (not default ones) regardless of game mode
      const customGroups = await getCustomGroups({
        locale,
        isDefault: false,
      });
      setExistingGroups(customGroups);

      // Load tile counts for each custom group across all game modes
      const counts: Record<string, number> = {};
      await Promise.all(
        customGroups.map(async (group) => {
          // Count tiles for this group across both online and local modes
          const onlineCount = await countTilesByGroup(group.name, locale, 'online');
          const localCount = await countTilesByGroup(group.name, locale, 'local');
          counts[group.id] = onlineCount + localCount;
        })
      );
      setTileCounts(counts);
    } catch (error) {
      console.error('Error reloading groups:', error);
    }
  }, [locale]);

  // Load existing groups
  useEffect(() => {
    const loadGroups = async () => {
      if (!open) return;

      setDialogState((prev) => ({ ...prev, isLoading: true }));
      try {
        await reloadGroupsAndCounts();
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setDialogState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadGroups();
  }, [open, locale, reloadGroupsAndCounts]);

  // Generate a unique name from label
  const generateGroupName = (displayLabel: string): string => {
    const sanitized = displayLabel
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20);
    return sanitized || `group_${nanoid(6).toLowerCase()}`;
  };

  // Get valid group types for current game mode
  const getValidGroupTypes = (gameMode: string): string[] => {
    if (gameMode === 'online') {
      return ['solo', 'consumption'];
    }
    return ['solo', 'foreplay', 'sex', 'consumption'];
  };

  // Initialize form with editing group data or defaults
  useEffect(() => {
    if (editingGroup) {
      const groupGameMode = editingGroup.gameMode || gameMode;
      const validTypes = getValidGroupTypes(groupGameMode);
      const currentType = editingGroup.type || '';

      setDialogState((prev) => ({ ...prev, currentEditingGroup: editingGroup }));
      setFormState({
        label: editingGroup.label,
        type: validTypes.includes(currentType) ? currentType : '',
        localGameMode: groupGameMode,
        selectedTemplateIndex: findMatchingTemplateIndex(editingGroup.intensities),
        intensityLabels: editingGroup.intensities.map((i) => i.label),
      });
    } else if (dialogState.currentEditingGroup) {
      const groupGameMode = dialogState.currentEditingGroup.gameMode || gameMode;
      const validTypes = getValidGroupTypes(groupGameMode);
      const currentType = dialogState.currentEditingGroup.type || '';

      setFormState({
        label: dialogState.currentEditingGroup.label,
        type: validTypes.includes(currentType) ? currentType : '',
        localGameMode: groupGameMode,
        selectedTemplateIndex: findMatchingTemplateIndex(
          dialogState.currentEditingGroup.intensities
        ),
        intensityLabels: dialogState.currentEditingGroup.intensities.map((i) => i.label),
      });
    } else {
      // Reset to defaults for new group
      setDialogState((prev) => ({ ...prev, currentEditingGroup: null }));
      setFormState({
        label: '',
        type: '',
        localGameMode: gameMode,
        selectedTemplateIndex: 0,
        intensityLabels: [
          t('intensityLabels.beginner'),
          t('intensityLabels.intermediate'),
          t('intensityLabels.advanced'),
        ],
      });
    }
    setDialogState((prev) => ({ ...prev, validation: { isValid: true, errors: [] } }));
  }, [editingGroup, dialogState.currentEditingGroup, open, gameMode, t]);

  // Clear invalid group type when game mode changes
  useEffect(() => {
    const validTypes = getValidGroupTypes(formState.localGameMode);
    if (formState.type && !validTypes.includes(formState.type)) {
      setFormState((prev) => ({ ...prev, type: '' }));
    }
  }, [formState.localGameMode, formState.type]);

  // Handle template selection
  const handleTemplateChange = (templateIndex: number) => {
    const template = DEFAULT_INTENSITY_TEMPLATES[templateIndex];
    setFormState((prev) => ({
      ...prev,
      selectedTemplateIndex: templateIndex,
      intensityLabels: template.intensities.map((i) => t(i.label)),
    }));
  };

  // Handle intensity label changes
  const updateIntensityLabel = (index: number, label: string) => {
    const newLabels = [...formState.intensityLabels];
    newLabels[index] = label;
    setFormState((prev) => ({ ...prev, intensityLabels: newLabels }));
  };

  // Add new intensity
  const addIntensity = () => {
    if (formState.intensityLabels.length >= 5) {
      // MAX_INTENSITIES_COUNT
      return;
    }

    setFormState((prev) => ({
      ...prev,
      intensityLabels: [
        ...prev.intensityLabels,
        t('customGroups.levelLabel', { level: prev.intensityLabels.length + 1 }),
      ],
    }));
  };

  // Remove intensity
  const removeIntensity = (index: number) => {
    if (formState.intensityLabels.length <= 2) {
      // MIN_INTENSITIES_COUNT
      return;
    }
    setFormState((prev) => ({
      ...prev,
      intensityLabels: prev.intensityLabels.filter((_, i) => i !== index),
    }));
  };

  // Validate form in real-time
  useEffect(() => {
    const validateForm = async () => {
      if (!formState.label.trim() && !formState.type && formState.intensityLabels.length === 0) {
        setDialogState((prev) => ({ ...prev, validation: { isValid: true, errors: [] } }));
        return;
      }

      // Validate type if provided
      const errors: string[] = [];

      if (formState.type && !VALID_GROUP_TYPES.includes(formState.type as GroupType)) {
        errors.push(t('typeValidationError', { types: VALID_GROUP_TYPES.join(', ') }));
      }

      if (formState.label.trim() && !formState.type) {
        errors.push(t('typeRequiredError'));
      }

      if (errors.length > 0) {
        setDialogState((prev) => ({ ...prev, validation: { isValid: false, errors } }));
        return;
      }

      // Generate intensities from labels
      const intensities: CustomGroupIntensity[] = formState.intensityLabels.map(
        (labelText, index) => ({
          id: nanoid(),
          label: labelText,
          value: index + 1,
          isDefault: false,
        })
      );

      const groupData: CustomGroupBase = {
        name: dialogState.currentEditingGroup
          ? dialogState.currentEditingGroup.name
          : generateGroupName(formState.label),
        label: formState.label.trim(),
        intensities,
        type: (formState.type as GroupType) || undefined,
        locale,
        gameMode: formState.localGameMode,
        isDefault: false,
      };

      const result = await validateCustomGroup(groupData, dialogState.currentEditingGroup?.id);
      setDialogState((prev) => ({ ...prev, validation: result }));
    };

    validateForm();
  }, [
    formState.label,
    formState.type,
    formState.intensityLabels,
    formState.localGameMode,
    locale,
    dialogState.currentEditingGroup,
    t,
  ]);

  // Handle editing an existing group
  const handleEditGroup = (group: CustomGroupPull) => {
    setDialogState((prev) => ({
      ...prev,
      currentEditingGroup: group,
      selectedTab: 1, // Switch to create/edit tab
    }));
    setFormState((prev) => ({
      ...prev,
      label: group.label,
      intensityLabels: group.intensities.map((i) => i.label),
    }));
  };

  // Handle deleting a group
  const handleDeleteGroup = async (groupId: string) => {
    const group = existingGroups.find((g) => g.id === groupId);
    if (!group) return;

    const tileCount = tileCounts[groupId] || 0;
    setPendingDeleteGroup({ id: groupId, name: group.label, tileCount });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteGroup) return;

    const { id, tileCount } = pendingDeleteGroup;
    const group = existingGroups.find((g) => g.id === id);
    if (!group) return;

    try {
      // First delete all associated custom tiles
      if (tileCount > 0) {
        await deleteCustomTilesByGroup(group.name, locale, gameMode);
      }

      // Then delete the group
      await deleteCustomGroup(id);

      // Reload groups and tile counts
      await reloadGroupsAndCounts();

      // Notify parent if needed
      onGroupUpdated?.(null); // Trigger refresh in parent
      // Groups will refresh automatically via reactive hooks
    } catch (error) {
      console.error('Error deleting group:', error);
    } finally {
      setDeleteDialogOpen(false);
      setPendingDeleteGroup(null);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!dialogState.validation.isValid || dialogState.isSubmitting) {
      return;
    }

    setDialogState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      // Generate intensities from labels with auto-incrementing values
      const intensities: CustomGroupIntensity[] = formState.intensityLabels.map(
        (labelText, index) => ({
          id: nanoid(),
          label: labelText,
          value: index + 1,
          isDefault: false,
        })
      );

      const groupData: CustomGroupBase = {
        name: dialogState.currentEditingGroup
          ? dialogState.currentEditingGroup.name
          : generateGroupName(formState.label),
        label: formState.label.trim(),
        intensities,
        type: (formState.type as GroupType) || undefined,
        locale,
        gameMode: formState.localGameMode,
        isDefault: false,
      };

      if (dialogState.currentEditingGroup) {
        // Update existing group
        await updateCustomGroup(dialogState.currentEditingGroup.id, groupData);
        onGroupUpdated?.(dialogState.currentEditingGroup);
        // Groups will be refreshed by the callback
      } else {
        // Create new group
        const groupId = await addCustomGroup(groupData);
        if (groupId) {
          onGroupCreated?.({
            ...groupData,
            id: groupId,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDefault: false,
            locale,
            gameMode: formState.localGameMode,
          });
          // Groups will be refreshed by the callback
        }
      }

      resetEditingState();
      onClose();
    } catch (error) {
      console.error('Error saving custom group:', error);
      setDialogState((prev) => ({
        ...prev,
        validation: {
          isValid: false,
          errors: [t('failedToSaveGroup', { error })],
        },
      }));
    } finally {
      setDialogState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Reset editing state when switching tabs or closing
  const resetEditingState = () => {
    setDialogState((prev) => ({
      ...prev,
      currentEditingGroup: null,
      validation: { isValid: true, errors: [] },
    }));
    setFormState({
      label: '',
      type: '',
      localGameMode: gameMode,
      selectedTemplateIndex: 0,
      intensityLabels: [
        t('intensityLabels.beginner'),
        t('intensityLabels.intermediate'),
        t('intensityLabels.advanced'),
      ],
    });
  };

  // Handle form state changes from sub-components
  const handleFormStateChange = (updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            minHeight: '600px',
          },
        }}
      >
        <DialogTitle>
          {t('customGroups.manageCustomGroups')}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('customGroups.createNewGroupsDescription')}
          </Typography>

          {/* Tabs */}
          <Tabs
            value={dialogState.selectedTab}
            onChange={(_, newValue) => {
              setDialogState((prev) => ({ ...prev, selectedTab: newValue }));
              if (newValue === 1 && !dialogState.currentEditingGroup) {
                // Switching to Create New tab - reset editing state
                resetEditingState();
              }
            }}
            sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={t('customGroups.existingGroups')} />
            <Tab
              label={
                dialogState.currentEditingGroup
                  ? t('customGroups.editGroup')
                  : t('customGroups.createNew')
              }
            />
          </Tabs>
        </DialogTitle>

        <DialogContent dividers>
          {/* Existing Groups Tab */}
          {dialogState.selectedTab === 0 && (
            <ManageTab
              existingGroups={existingGroups}
              loadingGroups={dialogState.isLoading}
              tileCounts={tileCounts}
              onEditGroup={handleEditGroup}
              onDeleteGroup={handleDeleteGroup}
            />
          )}

          {/* Create/Edit Group Tab */}
          {dialogState.selectedTab === 1 && (
            <CreateEditTab
              formState={formState}
              validation={dialogState.validation}
              currentEditingGroup={dialogState.currentEditingGroup}
              locale={locale}
              onFormStateChange={handleFormStateChange}
              generateGroupName={generateGroupName}
              updateIntensityLabel={updateIntensityLabel}
              addIntensity={addIntensity}
              removeIntensity={removeIntensity}
              handleTemplateChange={handleTemplateChange}
            />
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={dialogState.isSubmitting}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!dialogState.validation.isValid || dialogState.isSubmitting}
          >
            {dialogState.isSubmitting
              ? t('customGroups.saving')
              : dialogState.currentEditingGroup
                ? t('customGroups.updateGroup')
                : t('customGroups.createGroup')}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog
        open={deleteDialogOpen}
        pendingDeleteGroup={pendingDeleteGroup}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
