import { getAllAvailableGroups } from '@/stores/customGroups';
import { importActions } from '@/services/dexieActionImport';

export interface DataCompletenessReport {
  isComplete: boolean;
  missingGroups: string[];
  corruptedGroups: string[];
  totalExpectedGroups: number;
  totalDexieGroups: number;
  details: {
    [groupName: string]: {
      exists: boolean;
      hasIntensities: boolean;
      hasLabel: boolean;
      expectedIntensities: number;
      actualIntensities: number;
    };
  };
}

/**
 * Check if Dexie contains complete and valid data for a given locale and game mode
 * by comparing against the expected JSON structure
 */
export const checkDataCompleteness = async (
  locale = 'en',
  gameMode = 'online'
): Promise<DataCompletenessReport> => {
  const report: DataCompletenessReport = {
    isComplete: false,
    missingGroups: [],
    corruptedGroups: [],
    totalExpectedGroups: 0,
    totalDexieGroups: 0,
    details: {},
  };

  try {
    // Get expected groups from JSON files
    let expectedGroups: any = {};
    try {
      expectedGroups = await importActions(locale, gameMode);
    } catch (error) {
      console.warn(`Could not load expected actions for ${locale}/${gameMode}:`, error);
      // If we can't load expected data, we can't validate completeness
      return report;
    }

    const expectedGroupNames = Object.keys(expectedGroups);
    report.totalExpectedGroups = expectedGroupNames.length;

    // Get actual groups from Dexie
    let dexieGroups: any[] = [];
    try {
      dexieGroups = await getAllAvailableGroups(locale, gameMode);
    } catch (error) {
      console.warn(`Could not load Dexie groups for ${locale}/${gameMode}:`, error);
      return report;
    }

    report.totalDexieGroups = dexieGroups.length;

    // Create a map of Dexie groups by name for quick lookup
    const dexieGroupsMap = new Map(dexieGroups.map((group) => [group.name, group]));

    // Check each expected group
    for (const groupName of expectedGroupNames) {
      const expectedGroup = expectedGroups[groupName];
      const dexieGroup = dexieGroupsMap.get(groupName);

      const groupDetail = {
        exists: !!dexieGroup,
        hasIntensities: false,
        hasLabel: false,
        expectedIntensities: 0,
        actualIntensities: 0,
      };

      if (expectedGroup?.actions) {
        // Count expected intensities (excluding 'None')
        const expectedIntensityKeys = Object.keys(expectedGroup.actions).filter(
          (key) => key !== 'None'
        );
        groupDetail.expectedIntensities = expectedIntensityKeys.length;
      }

      if (dexieGroup) {
        groupDetail.hasLabel = !!dexieGroup.label;
        groupDetail.hasIntensities =
          Array.isArray(dexieGroup.intensities) && dexieGroup.intensities.length > 0;
        groupDetail.actualIntensities = dexieGroup.intensities?.length || 0;

        // Check if group is corrupted (missing essential data or incorrect intensity count)
        const isCorrupted =
          !groupDetail.hasLabel ||
          !groupDetail.hasIntensities ||
          (groupDetail.expectedIntensities > 0 &&
            groupDetail.actualIntensities !== groupDetail.expectedIntensities);

        if (isCorrupted) {
          report.corruptedGroups.push(groupName);
        }
      } else {
        report.missingGroups.push(groupName);
      }

      report.details[groupName] = groupDetail;
    }

    // Check if data is complete (no missing or corrupted groups)
    report.isComplete =
      report.missingGroups.length === 0 &&
      report.corruptedGroups.length === 0 &&
      report.totalDexieGroups >= report.totalExpectedGroups;

    return report;
  } catch (error) {
    console.error('Error in checkDataCompleteness:', error);
    return report;
  }
};

/**
 * Quick check if Dexie data is complete without detailed analysis
 * This is optimized for performance and can be used for frequent checks
 */
export const isDexieDataComplete = async (locale = 'en', gameMode = 'online'): Promise<boolean> => {
  try {
    // Quick check: compare group counts first
    const [expectedGroups, dexieGroups] = await Promise.all([
      importActions(locale, gameMode).catch(() => ({})),
      getAllAvailableGroups(locale, gameMode).catch(() => []),
    ]);

    const expectedCount = Object.keys(expectedGroups).length;
    const dexieCount = dexieGroups.length;

    // If counts don't match, definitely incomplete
    if (dexieCount < expectedCount) {
      return false;
    }

    // If counts match, do a quick validation of a few key groups
    const expectedGroupNames = Object.keys(expectedGroups);
    const dexieGroupNames = new Set(dexieGroups.map((g) => g.name));

    // Check if all expected groups exist in Dexie
    for (const groupName of expectedGroupNames) {
      if (!dexieGroupNames.has(groupName)) {
        return false;
      }
    }

    // Basic validation passed
    return true;
  } catch (error) {
    console.error('Error in isDexieDataComplete:', error);
    return false;
  }
};

/**
 * Get a summary of data completeness for debugging and monitoring
 */
export const getDataCompletenessSummary = async (
  locale = 'en',
  gameMode = 'online'
): Promise<string> => {
  try {
    const report = await checkDataCompleteness(locale, gameMode);

    let summary = `Data Completeness for ${locale}/${gameMode}:\n`;
    summary += `Overall: ${report.isComplete ? 'COMPLETE' : 'INCOMPLETE'}\n`;
    summary += `Expected groups: ${report.totalExpectedGroups}\n`;
    summary += `Dexie groups: ${report.totalDexieGroups}\n`;

    if (report.missingGroups.length > 0) {
      summary += `Missing groups: ${report.missingGroups.join(', ')}\n`;
    }

    if (report.corruptedGroups.length > 0) {
      summary += `Corrupted groups: ${report.corruptedGroups.join(', ')}\n`;
    }

    return summary;
  } catch (error) {
    return `Error generating completeness summary: ${error}`;
  }
};
