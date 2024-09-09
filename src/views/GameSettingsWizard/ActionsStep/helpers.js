export const populateSelections = (formData, optionList, type) => {
  return Object.entries(formData)
    .map(([key, entry]) => {
      if (entry.type !== type) return null;
      return { value: key, label: optionList.find((x) => x.value === key).label };
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
