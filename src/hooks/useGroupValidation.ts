/**
 * Custom hook for group form validation
 */
import { useMemo } from 'react';
// Validation hook with simple validation only
import type { CustomGroupPull, ValidationResult } from '@/types/customGroups';

interface ValidationHookProps {
  label: string;
  type: string;
  intensityLabels: string[];
  locale: string;
  gameMode: string;
  currentEditingGroup: CustomGroupPull | null;
}

export function useGroupValidation({
  label,
  type,
  intensityLabels,
}: ValidationHookProps): ValidationResult {
  return useMemo(() => {
    // Don't validate if required fields are empty (let the form handle required field errors)
    if (!label.trim() || !type) {
      return { isValid: true, errors: [] };
    }

    // Simple validation without database checks for immediate feedback
    const errors: string[] = [];

    if (!label.trim()) errors.push('Group name is required');
    if (!type) errors.push('Group type is required');
    if (intensityLabels.some((label) => !label.trim()))
      errors.push('All intensity labels are required');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [label, type, intensityLabels]);
}
