import { camelToPascal } from '@/helpers/strings';
import i18next from 'i18next';

export default function groupActionsFolder(actionsFolder) {
  const mappedGroups = Object.entries(actionsFolder).flatMap(([key, { label, actions }]) => {
    if (!actions) return [];
    const intensities = Object.keys(actions).filter((entry) => entry !== 'None');
    return intensities.map((intensity, index) => ({
      group: camelToPascal(key),
      groupLabel: label,
      value: key,
      intensity: Number(index + 1),
      translatedIntensity: intensity,
      label: `${label} - ${intensity}`,
    }));
  });

  return [
    ...mappedGroups,
    {
      group: i18next.t('misc'),
      groupLabel: i18next.t('misc'),
      value: 'misc',
      intensity: 1,
      translatedIntensity: i18next.t('all'),
      label: `${i18next.t('misc')} - ${i18next.t('all')}`,
    },
  ];
}
