/**
 * Custom hook for managing group form state
 */
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { CustomGroupPull, ValidationResult } from '@/types/customGroups';
import { validateCustomGroup } from '@/services/validationService';

interface GroupFormState {
  label: string;
  type: string;
  localGameMode: string;
  selectedTemplateIndex: number;
  intensityLabels: string[];
  currentEditingGroup: CustomGroupPull | null;
  validation: ValidationResult;
  isSubmitting: boolean;
}

interface GroupFormActions {
  setLabel: (label: string) => void;
  setType: (type: string) => void;
  setLocalGameMode: (gameMode: string) => void;
  setSelectedTemplateIndex: (index: number) => void;
  setIntensityLabels: (labels: string[]) => void;
  setCurrentEditingGroup: (group: CustomGroupPull | null) => void;
  setValidation: (validation: ValidationResult) => void;
  setIsSubmitting: (submitting: boolean) => void;
  resetForm: () => void;
  populateFromGroup: (group: CustomGroupPull) => void;
  validateForm: () => Promise<ValidationResult>;
}

export function useGroupForm(
  initialGameMode: string,
  locale: string
): [GroupFormState, GroupFormActions] {
  const { t } = useTranslation();

  // Form state
  const [label, setLabel] = useState('');
  const [type, setType] = useState('');
  const [localGameMode, setLocalGameMode] = useState(initialGameMode);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(1);
  const [intensityLabels, setIntensityLabels] = useState<string[]>([
    t('intensityLabels.beginner'),
    t('intensityLabels.intermediate'),
    t('intensityLabels.advanced'),
  ]);
  const [currentEditingGroup, setCurrentEditingGroup] = useState<CustomGroupPull | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setLabel('');
    setType('');
    setLocalGameMode(initialGameMode);
    setSelectedTemplateIndex(1);
    setIntensityLabels([
      t('intensityLabels.beginner'),
      t('intensityLabels.intermediate'),
      t('intensityLabels.advanced'),
    ]);
    setCurrentEditingGroup(null);
    setValidation({ isValid: true, errors: [] });
    setIsSubmitting(false);
  }, [initialGameMode, t]);

  // Populate form from existing group
  const populateFromGroup = useCallback(
    (group: CustomGroupPull) => {
      setLabel(group.label || '');
      setType(group.type || '');
      setLocalGameMode(group.gameMode || initialGameMode);
      setCurrentEditingGroup(group);

      // Set intensity labels if available
      if (group.intensities && group.intensities.length > 0) {
        const labels = group.intensities.map((intensity) => intensity.label);
        setIntensityLabels(labels);

        // Try to match template index based on intensity count
        if (labels.length === 3) setSelectedTemplateIndex(1);
        else if (labels.length === 5) setSelectedTemplateIndex(2);
        else if (labels.length === 10) setSelectedTemplateIndex(3);
        else setSelectedTemplateIndex(0); // Custom
      }
    },
    [initialGameMode]
  );

  // Validate current form state
  const validateForm = useCallback(async () => {
    // Create intensities from current state
    const intensities = intensityLabels.map((intensityLabel, index) => ({
      id: `temp-${index}`,
      label: intensityLabel,
      value: index + 1,
      isDefault: true,
    }));

    const groupData = {
      name: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      type: type as any,
      intensities,
      locale,
      gameMode: localGameMode,
      isDefault: false,
    };

    const result = await validateCustomGroup(groupData, currentEditingGroup?.id);

    setValidation(result);
    return result;
  }, [label, type, intensityLabels, locale, localGameMode, currentEditingGroup]);

  // Update game mode when prop changes
  useEffect(() => {
    setLocalGameMode(initialGameMode);
  }, [initialGameMode]);

  const state: GroupFormState = {
    label,
    type,
    localGameMode,
    selectedTemplateIndex,
    intensityLabels,
    currentEditingGroup,
    validation,
    isSubmitting,
  };

  const actions: GroupFormActions = {
    setLabel,
    setType,
    setLocalGameMode,
    setSelectedTemplateIndex,
    setIntensityLabels,
    setCurrentEditingGroup,
    setValidation,
    setIsSubmitting,
    resetForm,
    populateFromGroup,
    validateForm,
  };

  return [state, actions];
}
