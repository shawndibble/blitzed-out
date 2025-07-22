import CustomTiles from '@/views/CustomTileDialog';
import useUnifiedActionList from '@/hooks/useUnifiedActionList';
import useSettingsToFormData from '@/hooks/useSettingsToFormData';
import { CustomTilesDialogProps } from '@/types/customTilesDialog';

export default function CustomTilesDialog({ open, close = null }: CustomTilesDialogProps) {
  const [formData] = useSettingsToFormData();
  const { isLoading, actionsList } = useUnifiedActionList(formData?.gameMode);

  if (isLoading) return null;

  return (
    <CustomTiles
      setOpen={close || (() => {})}
      boardUpdated={() => null} // no need to call boardUpdated in this case
      actionsList={actionsList}
      open={open}
    />
  );
}
