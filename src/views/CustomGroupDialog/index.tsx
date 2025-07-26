import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { nanoid } from 'nanoid';
import { useTranslation } from 'react-i18next';
import {
  CustomGroupDialogProps,
  CustomGroupBase,
  CustomGroupIntensity,
  CustomGroupPull,
  DEFAULT_INTENSITY_TEMPLATES,
  ValidationResult,
} from '@/types/customGroups';
import {
  validateCustomGroup,
  validateGroupLabel,
  getValidationConstants,
  type GroupType,
} from '@/services/validationService';
import {
  addCustomGroup,
  updateCustomGroup,
  deleteCustomGroup,
  getAllAvailableGroups,
} from '@/stores/customGroups';
import { countTilesByGroup, deleteCustomTilesByGroup } from '@/stores/customTiles';

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
  const [selectedTab, setSelectedTab] = useState(0);
  const [existingGroups, setExistingGroups] = useState<CustomGroupPull[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [tileCounts, setTileCounts] = useState<Record<string, number>>({});
  const validationConstants = getValidationConstants();

  // Form state
  const [label, setLabel] = useState('');
  const [type, setType] = useState<string>('');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(1); // Default to Simple (1-3) template
  const [intensityLabels, setIntensityLabels] = useState<string[]>([
    t('intensityLabels.beginner'),
    t('intensityLabels.intermediate'),
    t('intensityLabels.advanced'),
  ]);
  const [currentEditingGroup, setCurrentEditingGroup] = useState<CustomGroupPull | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<{
    id: string;
    name: string;
    tileCount: number;
  } | null>(null);
  // UI state - removed expandedSection as we're no longer using accordions

  // Reload groups and tile counts
  const reloadGroupsAndCounts = useCallback(async () => {
    try {
      const groups = await getAllAvailableGroups(locale, gameMode);
      const customGroups = groups.filter((group) => !group.isDefault);
      setExistingGroups(customGroups);

      // Load tile counts for each custom group
      const counts: Record<string, number> = {};
      await Promise.all(
        customGroups.map(async (group) => {
          counts[group.id] = await countTilesByGroup(group.name, locale, gameMode);
        })
      );
      setTileCounts(counts);
    } catch (error) {
      console.error('Error reloading groups:', error);
    }
  }, [locale, gameMode]);

  // Load existing groups
  useEffect(() => {
    const loadGroups = async () => {
      if (!open) return;

      setLoadingGroups(true);
      try {
        await reloadGroupsAndCounts();
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroups();
  }, [open, locale, gameMode, reloadGroupsAndCounts]);

  // Generate a unique name from label
  const generateGroupName = (displayLabel: string): string => {
    const sanitized = displayLabel
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20);
    return sanitized || `group_${nanoid(6).toLowerCase()}`;
  };

  // Initialize form with editing group data or defaults
  useEffect(() => {
    if (editingGroup) {
      setCurrentEditingGroup(editingGroup);
      setLabel(editingGroup.label);
      setType(editingGroup.type || '');
      setIntensityLabels(editingGroup.intensities.map((i) => i.label));
      // Find matching template or reset to default
      const matchingTemplateIndex = DEFAULT_INTENSITY_TEMPLATES.findIndex(
        (template) => template.intensities.length === editingGroup.intensities.length
      );
      setSelectedTemplateIndex(matchingTemplateIndex >= 0 ? matchingTemplateIndex : 1);
    } else if (currentEditingGroup) {
      // Keep current editing group if we're in edit mode
      setLabel(currentEditingGroup.label);
      setType(currentEditingGroup.type || '');
      setIntensityLabels(currentEditingGroup.intensities.map((i) => i.label));
      // Find matching template or reset to default
      const matchingTemplateIndex = DEFAULT_INTENSITY_TEMPLATES.findIndex(
        (template) => template.intensities.length === currentEditingGroup.intensities.length
      );
      setSelectedTemplateIndex(matchingTemplateIndex >= 0 ? matchingTemplateIndex : 1);
    } else {
      // Reset to defaults for new group
      setCurrentEditingGroup(null);
      setLabel('');
      setType('');
      setSelectedTemplateIndex(1); // Default to Simple (1-3) template
      setIntensityLabels([
        t('intensityLabels.beginner'),
        t('intensityLabels.intermediate'),
        t('intensityLabels.advanced'),
      ]);
    }
    setValidation({ isValid: true, errors: [] });
  }, [editingGroup, currentEditingGroup, open, t]);

  // Handle template selection
  const handleTemplateChange = (templateIndex: number) => {
    const template = DEFAULT_INTENSITY_TEMPLATES[templateIndex];
    setSelectedTemplateIndex(templateIndex);
    setIntensityLabels(template.intensities.map((i) => t(i.label)));
  };

  // Handle intensity label changes
  const updateIntensityLabel = (index: number, label: string) => {
    const newLabels = [...intensityLabels];
    newLabels[index] = label;
    setIntensityLabels(newLabels);
  };

  // Add new intensity
  const addIntensity = () => {
    if (intensityLabels.length >= validationConstants.MAX_INTENSITIES_COUNT) {
      return;
    }

    setIntensityLabels([
      ...intensityLabels,
      t('customGroups.levelLabel', { level: intensityLabels.length + 1 }),
    ]);
  };

  // Remove intensity
  const removeIntensity = (index: number) => {
    if (intensityLabels.length <= validationConstants.MIN_INTENSITIES_COUNT) {
      return;
    }
    const newLabels = intensityLabels.filter((_, i) => i !== index);
    setIntensityLabels(newLabels);
  };

  // Validate form in real-time
  useEffect(() => {
    const validateForm = async () => {
      if (!label.trim() && !type && intensityLabels.length === 0) {
        setValidation({ isValid: true, errors: [] });
        return;
      }

      // Validate type if provided
      const errors: string[] = [];

      if (type && !validationConstants.VALID_GROUP_TYPES.includes(type as GroupType)) {
        errors.push(
          t('typeValidationError', { types: validationConstants.VALID_GROUP_TYPES.join(', ') })
        );
      }

      if (label.trim() && !type) {
        errors.push(t('typeRequiredError'));
      }

      if (errors.length > 0) {
        setValidation({ isValid: false, errors });
        return;
      }

      // Generate intensities from labels
      const intensities: CustomGroupIntensity[] = intensityLabels.map((labelText, index) => ({
        id: nanoid(),
        label: labelText,
        value: index + 1,
        isDefault: false,
      }));

      const groupData: CustomGroupBase = {
        name: currentEditingGroup ? currentEditingGroup.name : generateGroupName(label),
        label: label.trim(),
        intensities,
        type: (type as GroupType) || undefined,
        locale,
        gameMode,
        isDefault: false,
      };

      const result = await validateCustomGroup(groupData, currentEditingGroup?.id);
      setValidation(result);
    };

    validateForm();
  }, [
    label,
    type,
    intensityLabels,
    locale,
    gameMode,
    currentEditingGroup,
    t,
    validationConstants.VALID_GROUP_TYPES,
  ]);

  // Handle editing an existing group
  const handleEditGroup = (group: CustomGroupPull) => {
    setCurrentEditingGroup(group);
    setLabel(group.label);
    setIntensityLabels(group.intensities.map((i) => i.label));
    setSelectedTab(1); // Switch to create/edit tab
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
    } catch (error) {
      console.error('Error deleting group:', error);
    } finally {
      setDeleteDialogOpen(false);
      setPendingDeleteGroup(null);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validation.isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate intensities from labels with auto-incrementing values
      const intensities: CustomGroupIntensity[] = intensityLabels.map((labelText, index) => ({
        id: nanoid(),
        label: labelText,
        value: index + 1,
        isDefault: false,
      }));

      const groupData: CustomGroupBase = {
        name: currentEditingGroup ? currentEditingGroup.name : generateGroupName(label),
        label: label.trim(),
        intensities,
        type: (type as GroupType) || undefined,
        locale,
        gameMode,
        isDefault: false,
      };

      if (currentEditingGroup) {
        // Update existing group
        await updateCustomGroup(currentEditingGroup.id, groupData);
        onGroupUpdated?.(currentEditingGroup);
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
            gameMode,
          });
        }
      }

      resetEditingState();
      onClose();
    } catch (error) {
      console.error('Error saving custom group:', error);
      setValidation({
        isValid: false,
        errors: [t('failedToSaveGroup', { error })],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset editing state when switching tabs or closing
  const resetEditingState = () => {
    setCurrentEditingGroup(null);
    setLabel('');
    setType('');
    setSelectedTemplateIndex(1); // Reset to Simple (1-3) template
    setIntensityLabels([
      t('intensityLabels.beginner'),
      t('intensityLabels.intermediate'),
      t('intensityLabels.advanced'),
    ]);
    setValidation({ isValid: true, errors: [] });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { minHeight: '600px' } }}
      >
        <DialogTitle>
          {t('customGroups.manageCustomGroups')}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('customGroups.createNewGroupsDescription')}
          </Typography>

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => {
              setSelectedTab(newValue);
              if (newValue === 1 && !currentEditingGroup) {
                // Switching to Create New tab - reset editing state
                resetEditingState();
              }
            }}
            sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={t('customGroups.existingGroups')} />
            <Tab
              label={
                currentEditingGroup ? t('customGroups.editGroup') : t('customGroups.createNew')
              }
            />
          </Tabs>
        </DialogTitle>

        <DialogContent dividers>
          {/* Existing Groups Tab */}
          {selectedTab === 0 && (
            <Box>
              {loadingGroups ? (
                <Typography>{t('Loading groups...')}</Typography>
              ) : existingGroups.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  {t('customGroups.noCustomGroupsFound')}
                </Typography>
              ) : (
                <List>
                  {existingGroups.map((group, index) => (
                    <React.Fragment key={group.id}>
                      <ListItem>
                        <ListItemText
                          primary={group.label}
                          secondary={
                            <Box component="span" sx={{ display: 'block' }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                component="span"
                                sx={{ display: 'block' }}
                              >
                                {t('customGroups.intensityLevelsCount', {
                                  count: group.intensities.length,
                                })}
                                : {group.intensities.map((i) => i.label).join(', ')}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                component="span"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {t('customGroups.customTilesCount', {
                                  count: tileCounts[group.id] || 0,
                                })}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleEditGroup(group)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteGroup(group.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < existingGroups.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Create/Edit Group Tab */}
          {selectedTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Validation Errors */}
              {!validation.isValid && (
                <Alert severity="error">
                  {validation.errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </Alert>
              )}

              {/* Group Information Header */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {t('customGroups.groupInformation')}
                </Typography>

                <TextField
                  label={t('customGroups.groupLabel')}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., My Custom Group"
                  helperText={t('customGroups.groupLabelHelp', {
                    maxLength: validationConstants.MAX_GROUP_LABEL_LENGTH,
                  })}
                  fullWidth
                  required
                  error={label.trim().length > 0 && !validateGroupLabel(label).isValid}
                  sx={{ mb: 2 }}
                />

                <TextField
                  select
                  label={t('customGroups.groupType')}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  helperText={t('customGroups.groupTypeHelp')}
                  fullWidth
                  required
                  error={label.trim().length > 0 && !type}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">
                    <em>{t('groupTypes.selectType')}</em>
                  </MenuItem>
                  <MenuItem value="solo">{t('groupTypes.solo')}</MenuItem>
                  <MenuItem value="foreplay">{t('groupTypes.foreplay')}</MenuItem>
                  <MenuItem value="sex">{t('groupTypes.sex')}</MenuItem>
                  <MenuItem value="consumption">{t('groupTypes.consumption')}</MenuItem>
                </TextField>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('customGroups.locale')}</strong> {locale} |{' '}
                    <strong>{t('customGroups.gameMode')}</strong> {gameMode}
                  </Typography>
                  {currentEditingGroup ? (
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t('customGroups.internalId')}</strong> {currentEditingGroup.name}{' '}
                      (locked)
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t('customGroups.internalId')}</strong>{' '}
                      {label ? generateGroupName(label) : t('customGroups.autoGenerated')}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Quick Templates - Compact Inline */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 'medium', minWidth: 'auto' }}>
                  {t('customGroups.quickStart')}
                </Typography>
                <TextField
                  select
                  value={selectedTemplateIndex}
                  onChange={(e) => handleTemplateChange(Number(e.target.value))}
                  size="small"
                  sx={{ minWidth: 200 }}
                  label={t('customGroups.chooseTemplate')}
                >
                  {DEFAULT_INTENSITY_TEMPLATES.map((template, index) => (
                    <MenuItem key={index} value={index}>
                      {template.name === 'Basic (1-4)'
                        ? t('templateBasic')
                        : template.name === 'Simple (1-3)'
                          ? t('templateSimple')
                          : template.name === 'Extended (1-5)'
                            ? t('templateExtended')
                            : template.name}
                    </MenuItem>
                  ))}
                </TextField>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {t('customGroups.selectTemplateDescription')}
                </Typography>
              </Box>

              {/* Intensity Labels - Main Content Area */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {t('customGroups.intensityLabels')} ({intensityLabels.length}/
                  {validationConstants.MAX_INTENSITIES_COUNT})
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('customGroups.customizeIntensityDescription')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {intensityLabels.map((labelText, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ minWidth: '30px', fontWeight: 'bold', color: 'primary.main' }}
                      >
                        {index + 1}
                      </Typography>
                      <TextField
                        label={t('customGroups.levelInputLabel', { level: index + 1 })}
                        value={labelText}
                        onChange={(e) => updateIntensityLabel(index, e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                        inputProps={{ maxLength: validationConstants.MAX_INTENSITY_LABEL_LENGTH }}
                      />
                      <IconButton
                        onClick={() => removeIntensity(index)}
                        disabled={
                          intensityLabels.length <= validationConstants.MIN_INTENSITIES_COUNT
                        }
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}

                  <Button
                    startIcon={<AddIcon />}
                    onClick={addIntensity}
                    disabled={intensityLabels.length >= validationConstants.MAX_INTENSITIES_COUNT}
                    variant="outlined"
                    size="small"
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                  >
                    {t('customGroups.addIntensityLevel')}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!validation.isValid || isSubmitting}
          >
            {isSubmitting
              ? t('customGroups.saving')
              : currentEditingGroup
                ? t('customGroups.updateGroup')
                : t('customGroups.createGroup')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('customGroups.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {(pendingDeleteGroup?.tileCount ?? 0) > 0
              ? t('customGroups.deleteGroupWithTiles', {
                  name: pendingDeleteGroup?.name,
                  count: pendingDeleteGroup?.tileCount,
                })
              : t('customGroups.deleteGroupConfirm', { name: pendingDeleteGroup?.name })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('cancel')}</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {t('Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
