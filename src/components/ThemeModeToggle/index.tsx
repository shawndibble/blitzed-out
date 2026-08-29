import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/context/theme';
import { ThemeMode } from '@/types/Settings';

const MODES: { value: ThemeMode; Icon: typeof LightModeIcon }[] = [
  { value: 'light', Icon: LightModeIcon },
  { value: 'dark', Icon: DarkModeIcon },
  { value: 'system', Icon: SettingsBrightnessIcon },
];

export default function ThemeModeToggle() {
  const { themeMode, setThemeMode } = useTheme();
  const { t } = useTranslation();

  // ToggleButtonGroup hands back null when the active button is clicked again.
  // Theme always has a value, so treat that as a no-op rather than clearing it.
  const handleChange = (_event: React.MouseEvent<HTMLElement>, next: ThemeMode | null): void => {
    if (next) setThemeMode(next);
  };

  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      size="small"
      value={themeMode}
      onChange={handleChange}
      aria-label={t('theme.label')}
    >
      {MODES.map(({ value, Icon }) => (
        <Tooltip key={value} title={t(`theme.${value}`)} arrow>
          <ToggleButton value={value} aria-label={t(`theme.${value}`)}>
            <Icon fontSize="small" />
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
}
