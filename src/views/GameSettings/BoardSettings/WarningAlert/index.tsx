import { Alert } from '@mui/material';
import { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';
import { Settings } from '@/types/Settings';

interface ConsumptionWarningProps {
  formData: Settings;
}

export default function ConsumptionWarning({
  formData,
}: ConsumptionWarningProps): JSX.Element | null {
  const consumptionCount = Object.values(formData).filter(
    (setting) =>
      typeof setting === 'object' &&
      setting?.type === 'consumption' &&
      setting?.levels &&
      setting.levels.length > 0
  ).length;
  const totalCount = Object.values(formData).filter(
    (setting) => typeof setting === 'object' && setting?.levels && setting.levels.length > 0
  ).length;

  const shouldShowWarning =
    consumptionCount > 1 && consumptionCount >= totalCount - consumptionCount;
  const [showWarning, setShowWarning] = useState<boolean>(shouldShowWarning);

  useEffect(() => {
    if (shouldShowWarning !== showWarning) {
      queueMicrotask(() => {
        setShowWarning(shouldShowWarning);
      });
    }
  }, [shouldShowWarning, showWarning]);

  if (!showWarning) return null;

  return (
    <Alert severity="warning">
      <Trans i18nKey="consumptionWarning" />
    </Alert>
  );
}
