import React from 'react';
import CustomTiles from '@/views/CustomTileDialog';
import useActionList from '@/hooks/useActionList';
import useSettingsToFormData from '@/hooks/useSettingsToFormData';

export default function CustomTilesDialog({ open, close = null }) {
  const [formData] = useSettingsToFormData();
  const { isLoading, actionsList } = useActionList(formData?.gameMode);

  if (isLoading) return null;

  return (
    <CustomTiles
      setOpen={close}
      boardUpdated={() => null} // no need to call boardUpdated in this case
      actionsList={actionsList}
      open={open}
    />
  );
}