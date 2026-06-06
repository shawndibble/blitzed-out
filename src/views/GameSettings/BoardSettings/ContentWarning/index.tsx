import { Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { Settings } from '@/types/Settings';
import useBoardContentWarnings from '@/hooks/useBoardContentWarnings';

interface ContentWarningProps {
  formData: Settings;
  actionsList: Record<string, { label?: string }>;
}

/**
 * Surfaces authoring-time board-health warnings (groups with no available tiles,
 * or a board where most slots would be empty) so authors can fix sparse boards
 * before playing. Renders nothing when the board is healthy.
 */
export default function ContentWarning({
  formData,
  actionsList,
}: ContentWarningProps): JSX.Element | null {
  const { t } = useTranslation();
  const { missingGroups, lowContent } = useBoardContentWarnings(formData);

  if (!missingGroups.length && !lowContent) return null;

  const groupLabels = missingGroups.map((key) => actionsList[key]?.label || key).join(', ');

  return (
    <>
      {missingGroups.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {t('missingGroupsWarning', { groups: groupLabels })}
        </Alert>
      )}
      {lowContent && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {t('sparseBoardWarning')}
        </Alert>
      )}
    </>
  );
}
