import YesNoSwitch from '@/components/GameForm/YesNoSwitch';
import { ChangeEvent } from 'react';
import { Settings } from '@/types/Settings';

interface AppBoolSwitchProps {
  field: string;
  formData: Settings;
  handleSwitch: (event: ChangeEvent<HTMLInputElement>, field: string) => void;
  defaultValue?: boolean;
}

export default function AppBoolSwitch({
  field,
  formData,
  handleSwitch,
  defaultValue = false,
}: AppBoolSwitchProps): JSX.Element {
  return (
    <YesNoSwitch
      trueCondition={formData[field] ?? defaultValue}
      onChange={(event) => handleSwitch(event, field)}
      yesLabel={field}
      sx={{ justifyContent: 'left' }}
    />
  );
}
