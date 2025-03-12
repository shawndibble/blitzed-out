import React, { lazy, Suspense } from 'react';
import useActionList from '@/hooks/useActionList';
import useSettingsToFormData from '@/hooks/useSettingsToFormData';

const CustomTiles = lazy(() => import('@/views/CustomTileDialog'));

export default function CustomTilesDialog({ open, close = null }) {
  const [formData] = useSettingsToFormData();
  const { isLoading, actionsList } = useActionList(formData?.gameMode);

  if (isLoading) return null;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomTiles
        setOpen={close}
        boardUpdated={() => null}
        actionsList={actionsList}
        open={open}
      />
    </Suspense>
  );
}