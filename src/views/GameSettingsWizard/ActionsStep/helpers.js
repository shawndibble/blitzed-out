const shouldPurgeAction = (formData, entry) => {
  const { gameMode, isNaked } = formData;
  return (
    (gameMode === 'online' && ['foreplay', 'sex'].includes(entry.type)) ||
    (gameMode === 'local' && isNaked && ['solo', 'foreplay'].includes(entry.type)) ||
    (gameMode === 'local' && !isNaked && ['solo', 'sex'].includes(entry.type))
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
      const label = optionList.find((x) => x.value === key)?.label;
      if (entry.type !== type || !label) return null;
      return { value: key, label };
    })
    .filter((x) => x);
};

export const removeFromFormData = (setFormData, selection, newValue) => {
  const removed = selection.filter((x) => !newValue.includes(x));

  if (removed.length) {
    setFormData((prevData) => {
      const newFormData = { ...prevData };
      removed.forEach((option) => delete newFormData[option.value]);
      return newFormData;
    });
  }
};
