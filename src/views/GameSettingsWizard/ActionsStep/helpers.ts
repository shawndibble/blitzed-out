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
  return Object.entries(formData).reduce<FormData>((acc, [key, data]) => {
    // only allow non-purged actions to be in our list.
    if (!shouldPurgeAction(formData, data as ActionEntry)) {
      acc[key] = data;
    }
    return acc;
  }, {} as FormData);
};

export const populateSelections = (
  formData: FormData,
  optionList: Option[],
  type: string
): string[] => {
  return Object.entries(formData)
    .map(([key, entry]) => {
      const found = optionList.find((x) => x.value === key);
      if ((entry as ActionEntry).type !== type || !found) return null;
      return key;
    })
    .filter((x): x is string => !!x);
};

// if prevData has a type of action that isn't in the value array, delete it.
const deleteOldFormData = (prevData: FormData, action: string, value: string[]): FormData => {
  const newFormData = { ...prevData };
  Object.keys(newFormData).forEach((key) => {
    if ((newFormData[key] as ActionEntry).type === action && !value.includes(key)) {
      delete newFormData[key];
    }
  });
  return newFormData;
};

export const updateFormDataWithDefaults = (
  value: string[],
  action: string,
  setFormData: React.Dispatch<React.SetStateAction<Settings>>
): void => {
  setFormData((prevData) => {
    const newFormData = deleteOldFormData(prevData, action, value);
    value.forEach((option) => {
      if (newFormData[option]) {
        return;
      }

      let data: ActionEntry = { type: action, level: 1 };
      if (action === 'consumption') {
        data = {
          ...data,
          variation: (newFormData as any).isAppend ? 'appendMost' : 'standalone',
        };
      }
      newFormData[option] = data;
    });
    return newFormData;
  });
};

export const handleChange = (
  event: ChangeEvent<HTMLInputElement> | { target: { value: number } } | null,
  key: string,
  action: string,
  setFormData: SetFormDataFunction,
  setSelectedItems: SetSelectedItemsFunction,
  variation: string | null = null
): void => {
  const value = event?.target?.value;

  if (value === 0) {
    setSelectedItems((prev) => prev.filter((x) => x !== key));
    return setFormData((prevData) => {
      const newFormData = { ...prevData };
      delete newFormData[key];
      return newFormData;
    });
  }

  setFormData((prevData) => ({
    ...prevData,
    [key]: {
      ...((prevData[key] as object) || {}),
      type: action,
      level: value,
      ...(!!variation && { variation }),
    },
  }));
};

export const handleSelectionChange = (
  event: { target: { value: string[] } },
  maxItems: number,
  action: string,
  setSelectedItems: SetSelectedItemsFunction,
  setFormData: SetFormDataFunction
): void => {
  const { value } = event.target;

  if (value.length <= maxItems) {
    setSelectedItems(value);
    updateFormDataWithDefaults(value, action, setFormData);
  }
};
