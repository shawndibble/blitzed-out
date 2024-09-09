import YesNoSwitch from 'components/GameForm/YesNoSwitch';

export default function AppBoolSwitch({ field, formData, handleSwitch }) {
  return (
    <YesNoSwitch
      trueCondition={formData[field]}
      onChange={(event) => handleSwitch(event, field)}
      yesLabel={`${field}Enable`}
      noLabel={`${field}Disable`}
      sx={{ justifyContent: 'left' }}
    />
  );
}
