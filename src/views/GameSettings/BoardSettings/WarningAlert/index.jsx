import { Alert } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';
import { Settings } from '@/types/Settings';

interface ConsumptionWarningProps {
  formData: Settings;
}

export default function ConsumptionWarning({ formData }: ConsumptionWarningProps): JSX.Element | null {
  const [showWarning, setShowWarning] = useState<boolean>(false);

  useEffect(() => {
    const consumptionCount = Object.values(formData).filter(
      (setting) => typeof setting === 'object' && setting?.type === 'consumption' && setting?.level > 0
    ).length;
    const totalCount = Object.values(formData).filter(
      (setting) => typeof setting === 'object' && setting?.level > 0
    ).length;

    setShowWarning(consumptionCount > 1 && consumptionCount >= totalCount - consumptionCount);
  }, [formData]);

  if (!showWarning) return null;

  return (
    <Alert severity="warning">
      <Trans i18nKey="consumptionWarning" />
    </Alert>
  );
}
