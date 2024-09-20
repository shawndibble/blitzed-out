import { isOnlineMode } from 'helpers/strings';

const shouldPurgeAction = (formData, entry) => {
  const { gameMode, isNaked } = formData;
  const isSolo = isOnlineMode(gameMode);
  return (
    (isSolo && ['foreplay', 'sex'].includes(entry.type)) ||
    (!isSolo && isNaked && ['solo', 'foreplay'].includes(entry.type)) ||
    (!isSolo && !isNaked && ['solo', 'sex'].includes(entry.type))
  );
};

export const purgedFormData = (formData) => {
  return Object.entries(formData).reduce((acc, [key, data]) => {
    // only allow non-purged actions to be in our list.
    if (!shouldPurgeAction(formData, data)) {
      acc[key] = data;
    }
    return acc;
  }, {});
};

export const populateSelections = (formData, optionList, type) => {
  return Object.entries(formData)
    .map(([key, entry]) => {
      const found = optionList.find((x) => x.value === key);
      if (entry.type !== type || !found) return null;
      return key;
    })
    .filter((x) => x);
};

// if prevData has a type of action that isn't in the value array, delete it.
const deleteOldFormData = (prevData, action, value) => {
  const newFormData = { ...prevData };
  Object.keys(newFormData).forEach((key) => {
    if (newFormData[key].type === action && !value.includes(key)) {
      delete newFormData[key];
    }
  });
  return newFormData;
};

export const updateFormDataWithDefaults = (value, action, setFormData) => {
  setFormData((prevData) => {
    const newFormData = deleteOldFormData(prevData, action, value);
    value.forEach((option) => {
      if (newFormData[option]) {
        return;
      }

      let data = { type: action, level: 1 };
      if (action === 'consumption') {
        data = {
          ...data,
          variation: newFormData.isAppend ? 'appendMost' : 'standalone',
        };
      }
      newFormData[option] = data;
    });
    return newFormData;
  });
};

export const handleChange = (
  event,
  key,
  action,
  setFormData,
  setSelectedItems,
  variation = null
) => {
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
      ...prevData[key],
      type: action,
      level: value,
      ...(!!variation && { variation }),
    },
  }));
};

export const handleSelectionChange = (event, maxItems, action, setSelectedItems, setFormData) => {
  const { value } = event.target;

  if (value.length <= maxItems) {
    setSelectedItems(value);
    updateFormDataWithDefaults(value, action, setFormData);
  }
};
