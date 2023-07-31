import { camelToPascal } from 'helpers/strings';
import i18next from 'i18next';

export default function groupDataFolder(dataFolder) {
  const mappedGroups = Object.entries(dataFolder).map(([key, { label, actions }]) => {
    const intensities = Object.keys(actions).filter((entry) => entry !== 'None');
    return intensities.map((intensity, index) => ({
      group: camelToPascal(key),
      value: key,
      intensity: Number(index + 1),
      translatedIntensity: intensity,
      label: `${label} - ${intensity}`,
    }));
  }).flat();

  mappedGroups.push({
    group: i18next.t('misc'),
    value: 'misc',
    intensity: 1,
    translatedIntensity: i18next.t('all'),
    label: `${i18next.t('misc')} - ${i18next.t('all')}`,
  });

  return mappedGroups;
}
