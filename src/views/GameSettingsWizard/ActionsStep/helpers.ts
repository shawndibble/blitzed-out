import { isOnlineMode } from '@/helpers/strings';
import { FormData, ActionEntry, Option } from '@/types';
import { Settings } from '@/types/Settings';
import { ChangeEvent } from 'react';

type SetFormDataFunction = React.Dispatch<React.SetStateAction<FormData>>;
type SetSelectedItemsFunction = React.Dispatch<React.SetStateAction<string[]>>;

const shouldPurgeAction = (formData: FormData, entry: ActionEntry): boolean => {
  const { gameMode, isNaked } = formData;
  const isSolo = isOnlineMode(gameMode);
  return (
    (isSolo && ['foreplay', 'sex'].includes(entry.type)) ||
    (!isSolo && isNaked && ['solo', 'foreplay'].includes(entry.type)) ||
    (!isSolo && !isNaked && ['solo', 'sex'].includes(entry.type))
  );
};

export const purgedFormData = (formData: FormData): FormData => {
  const newFormData = { ...formData };
  const selectedActions = formData.selectedActions || {};
  const purgedSelectedActions: Record<string, ActionEntry> = {};

  // Purge selectedActions instead of root-level entries
  Object.entries(selectedActions).forEach(([key, entry]) => {
    if (!shouldPurgeAction(formData, entry as ActionEntry)) {
      purgedSelectedActions[key] = entry as ActionEntry;
    }
  });

  newFormData.selectedActions = purgedSelectedActions;
  return newFormData;
};

export const populateSelections = (
  formData: FormData,
  optionList: Option[],
  type: string
): string[] => {
  const selectedActions = formData.selectedActions || {};
  return Object.entries(selectedActions)
    .map(([key, entry]) => {
      const found = optionList.find((x) => x.value === key);
      if ((entry as ActionEntry).type !== type || !found) return null;
      return key;
    })
    .filter((x): x is string => !!x);
};

// if prevData has a type of action that isn't in the value array, delete it.
const removeUnselectedActions = (
  prevData: FormData,
  action: 'sex' | 'foreplay' | 'consumption' | 'solo',
  value: string[]
): FormData => {
  const newFormData = { ...prevData };
  const newSelectedActions = { ...(newFormData.selectedActions as Record<string, ActionEntry>) };

  Object.keys(newSelectedActions).forEach((key) => {
    if ((newSelectedActions[key] as ActionEntry).type === action && !value.includes(key)) {
      delete newSelectedActions[key];
    }
  });

  newFormData.selectedActions = newSelectedActions;
  return newFormData;
};

export const updateFormDataWithDefaults = (
  value: string[],
  action: 'sex' | 'foreplay' | 'consumption' | 'solo',
  setFormData: React.Dispatch<React.SetStateAction<Settings>>
): void => {
  setFormData((prevData) => {
    const newFormData = removeUnselectedActions(prevData, action, value);
    const newSelectedActions = { ...(newFormData.selectedActions as Record<string, ActionEntry>) };

    value.forEach((option) => {
      if (newSelectedActions[option]) {
        return;
      }

      let data: ActionEntry = { type: action, levels: [1] };
      if (action === 'consumption') {
        data = {
          ...data,
          variation: newFormData.isAppend ? 'appendMost' : 'standalone',
        };
      }
      newSelectedActions[option] = data;
    });

    return { ...newFormData, selectedActions: newSelectedActions };
  });
};

export const handleChange = (
  event: ChangeEvent<HTMLInputElement> | { target: { value: number } } | null,
  key: string,
  action: 'sex' | 'foreplay' | 'consumption',
  setFormData: SetFormDataFunction,
  setSelectedItems: SetSelectedItemsFunction,
  variation: string | null = null
): void => {
  const value = event?.target?.value;

  if (value === 0) {
    setSelectedItems((prev) => prev.filter((x) => x !== key));
    return setFormData((prevData) => {
      const newSelectedActions = { ...(prevData.selectedActions || {}) } as Record<
        string,
        ActionEntry
      >;
      delete newSelectedActions[key];
      return { ...prevData, selectedActions: newSelectedActions };
    });
  }

  setFormData((prevData) => {
    const newSelectedActions = { ...(prevData.selectedActions || {}) } as Record<
      string,
      ActionEntry
    >;
    let numValue: number;
    if (typeof value === 'number') {
      numValue = value;
    } else if (isNaN(Number(value))) {
      numValue = 0;
    } else {
      numValue = Number(value);
    }
    // Convert single level to levels array for backward compatibility
    const levels = numValue > 0 ? Array.from({ length: numValue }, (_, i) => i + 1) : [];

    newSelectedActions[key] = {
      ...(newSelectedActions[key] || {}),
      type: action,
      levels,
      ...(!!variation && { variation }),
    };
    return { ...prevData, selectedActions: newSelectedActions };
  });
};

export const handleLevelsChange = (
  levels: number[],
  key: string,
  action: 'sex' | 'foreplay' | 'consumption' | 'solo',
  setFormData: SetFormDataFunction,
  variation: string | null = null
): void => {
  setFormData((prevData) => {
    const newSelectedActions = { ...(prevData.selectedActions || {}) } as Record<
      string,
      ActionEntry
    >;

    if (levels.length === 0) {
      // Remove action if no levels selected
      delete newSelectedActions[key];
    } else {
      newSelectedActions[key] = {
        ...(newSelectedActions[key] || {}),
        type: action,
        levels,
        ...(!!variation && { variation }),
      };
    }

    return { ...prevData, selectedActions: newSelectedActions };
  });
};

/**
 * Checks if the user has made valid selections for actions
 * @param selectedActions - The selected actions object from form data
 * @returns boolean indicating if there are valid selections
 */
export const hasValidSelections = (selectedActions?: Record<string, any>): boolean => {
  return Boolean(
    selectedActions &&
      Object.keys(selectedActions).some((key) => {
        const action = selectedActions[key];
        const hasLevels = action?.levels && action.levels.length > 0;
        return hasLevels && action?.variation !== 'appendMost';
      })
  );
};

export const handleSelectionChange = (
  event: { target: { value: string[] } },
  maxItems: number,
  action: 'sex' | 'foreplay' | 'consumption',
  setSelectedItems: SetSelectedItemsFunction,
  setFormData: SetFormDataFunction
): void => {
  const { value } = event.target;

  if (value.length <= maxItems) {
    setSelectedItems(value);
    updateFormDataWithDefaults(value, action, setFormData);
  }
};
