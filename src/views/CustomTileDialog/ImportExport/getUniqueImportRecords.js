/**
 * Validates the group match within each entry.
 * @param {string} entry - The entry to validate.
 * @throws Will throw an error if the entry does not contain exactly two brackets.
 */
function validateGroupMatch(entry) {
  const groupMatch = entry.match(/\[|\]/g)?.length;
  if (groupMatch !== 2) {
    throw new Error('ctSeparatorError');
  }
}

/**
 * Compares two arrays of tags to determine if they are equal.
 * @param {Array} tags1 - The first array of tags.
 * @param {Array} tags2 - The second array of tags.
 * @returns {boolean} - True if the arrays contain the same tags, false otherwise.
 */
function areTagsEqual(tags1, tags2) {
  const sortedTags1 = tags1?.sort() || [];
  const sortedTags2 = tags2?.sort() || [];
  return JSON.stringify(sortedTags1) === JSON.stringify(sortedTags2);
}

/**
 * Parses and transforms a single tile entry into a structured object.
 * @param {string} tile - The tile entry to parse.
 * @param {Array} mappedGroups - The array of mapped groups.
 * @returns {Object} - The parsed tile as an object.
 * @throws Will throw an error if the tile cannot be parsed correctly.
 */
function parseTile(tile, mappedGroups) {
  const [preGrouping, action, tagString] = tile.split('\n').filter(Boolean);
  const tags =
    tagString?.replace('Tags:', '')?.trim()?.split(', ')?.filter(Boolean) || [];
  const withoutBrackets = preGrouping.replace(/\[|\]/g, '');
  const [group, intensity] = withoutBrackets.split(' - ');

  const appGroup = mappedGroups.find(
    (mapped) =>
      mapped.translatedIntensity === intensity && mapped.group === group
  );

  if (!appGroup) {
    throw new Error('ctGroupError');
  }
  if (!action) {
    throw new Error('ctActionError');
  }

  return {
    group: appGroup.value,
    intensity: appGroup.intensity,
    action,
    tags,
  };
}

/**
 * Processes import data to identify new unique records and existing records with changed tags.
 * @param {Object} importData - The import data to process.
 * @param {Array} customTiles - The array of existing custom tiles.
 * @param {Array} mappedGroups - The array of mapped groups.
 * @returns {Object} - An object containing new unique records and existing records with changed tags.
 */
export default function getUniqueImportRecords(
  importData,
  customTiles,
  mappedGroups
) {
  const preArray = importData?.split('---') || [];
  preArray.forEach(validateGroupMatch);

  const result = preArray
    .map((tile) => parseTile(tile, mappedGroups))
    .filter(Boolean);

  const newUniqueRecords = [];
  const changedTagRecords = [];

  result.forEach((entry) => {
    const existingRecord = customTiles.find(
      (existing) =>
        existing.group === entry.group &&
        existing.intensity === entry.intensity &&
        existing.action === entry.action
    );

    if (!existingRecord) {
      newUniqueRecords.push(entry);
    } else if (
      existingRecord &&
      !areTagsEqual(existingRecord.tags, entry.tags)
    ) {
      changedTagRecords.push({ ...existingRecord, tags: entry.tags });
    }
  });

  return { newUniqueRecords, changedTagRecords };
}
