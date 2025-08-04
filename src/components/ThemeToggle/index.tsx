import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

import { useTheme } from '@/context/theme';
import { useTranslation } from 'react-i18next';

interface ThemeToggleProps {
  /** Size of the icon button */
  size?: 'small' | 'medium' | 'large';
  /** Custom tooltip text */
  tooltip?: string;
  /** Custom aria-label for accessibility */
  'aria-label'?: string;
}

const themeIcons = {
  light: LightModeIcon,
  dark: DarkModeIcon,
};

export default function ThemeToggle({
  size = 'medium',
  tooltip,
  'aria-label': ariaLabel,
}: ThemeToggleProps) {
  const { resolvedThemeMode, toggleTheme } = useTheme();
  const { t } = useTranslation();

  // Get current icon based on resolved theme mode
  const CurrentIcon = themeIcons[resolvedThemeMode];

  // Handle toggle
  const handleToggle = () => {
    toggleTheme();
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (tooltip) return tooltip;

    return resolvedThemeMode === 'light'
      ? t('theme.switchToDark', 'Switch to dark theme')
      : t('theme.switchToLight', 'Switch to light theme');
  };

  // Get aria-label for accessibility
  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel;
    return `Toggle theme, currently ${resolvedThemeMode}`;
  };

  return (
    <Tooltip title={getTooltipText()} arrow>
      <IconButton
        onClick={handleToggle}
        size={size}
        aria-label={getAriaLabel()}
        sx={{
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            backgroundColor: 'action.hover',
          },
          '& .MuiSvgIcon-root': {
            transition: 'transform 0.3s ease',
          },
          '&:hover .MuiSvgIcon-root': {
            transform: 'rotate(180deg)',
          },
        }}
      >
        <CurrentIcon />
      </IconButton>
    </Tooltip>
  );
}
