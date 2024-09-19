import { Alert } from '@mui/material';
import { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';

export default function ConsumptionWarning({ formData }) {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const consumptionCount = Object.values(formData).filter(
      (setting) => setting?.type === 'consumption' && setting?.level > 0
    ).length;
    const totalCount = Object.values(formData).filter((setting) => setting?.level > 0).length;

    setShowWarning(consumptionCount > 1 && consumptionCount >= totalCount - consumptionCount);
  }, [formData]);

  if (!showWarning) return null;

  return (
    <Alert severity="warning">
      <Trans i18nKey="consumptionWarning" />
    </Alert>
  );
}
