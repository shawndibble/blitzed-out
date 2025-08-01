import React from 'react';
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fade,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  SettingsBrightness as SystemIcon,
} from '@mui/icons-material';
import { useTheme } from '@/context/theme';
import { ThemeMode } from '@/types/Settings';
import { useTranslation } from 'react-i18next';

interface ThemeToggleProps {
  /** Size of the icon button */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show a simple toggle (light/dark only) or full menu */
  variant?: 'toggle' | 'menu';
  /** Custom tooltip text */
  tooltip?: string;
  /** Whether to show theme name in menu items */
  showLabels?: boolean;
  /** Custom aria-label for accessibility */
  'aria-label'?: string;
}

const themeIcons = {
  light: LightModeIcon,
  dark: DarkModeIcon,
  system: SystemIcon,
};

const themeLabels = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'Follow system',
};

export default function ThemeToggle({
  size = 'medium',
  variant = 'menu',
  tooltip,
  showLabels = true,
  'aria-label': ariaLabel,
}: ThemeToggleProps) {
  const muiTheme = useMuiTheme();
  const { themeMode, resolvedThemeMode, setThemeMode, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Get current icon based on theme mode
  const getCurrentIcon = () => {
    if (themeMode === 'system') {
      return SystemIcon;
    }
    return themeIcons[resolvedThemeMode];
  };

  const CurrentIcon = getCurrentIcon();

  // Handle simple toggle
  const handleToggle = () => {
    if (variant === 'toggle') {
      toggleTheme();
    } else {
      setAnchorEl(null);
    }
  };

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (variant === 'menu') {
      setAnchorEl(event.currentTarget);
    } else {
      handleToggle();
    }
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle theme selection
  const handleThemeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
    handleMenuClose();
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (tooltip) return tooltip;

    if (variant === 'toggle') {
      return resolvedThemeMode === 'light'
        ? t('theme.switchToDark', 'Switch to dark theme')
        : t('theme.switchToLight', 'Switch to light theme');
    }

    return t('theme.chooseTheme', 'Choose theme');
  };

  // Get aria-label for accessibility
  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel;

    if (variant === 'toggle') {
      return `Toggle theme, currently ${resolvedThemeMode}`;
    }
    return `Theme menu, currently ${themeMode}`;
  };

  if (variant === 'toggle') {
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

  return (
    <>
      <Tooltip title={getTooltipText()} arrow>
        <IconButton
          onClick={handleMenuOpen}
          size={size}
          aria-label={getAriaLabel()}
          aria-controls={open ? 'theme-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          sx={{
            transition: 'all 0.3s ease',
            backgroundColor: open ? 'action.selected' : 'transparent',
            '&:hover': {
              transform: 'scale(1.05)',
              backgroundColor: 'action.hover',
            },
            '& .MuiSvgIcon-root': {
              transition: 'transform 0.3s ease',
            },
          }}
        >
          <CurrentIcon />
        </IconButton>
      </Tooltip>

      <Menu
        id="theme-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1,
            minWidth: 160,
            borderRadius: 2,
            border: `1px solid ${muiTheme.palette.divider}`,
            '& .MuiMenuItem-root': {
              borderRadius: 1,
              margin: '2px 4px',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'translateX(4px)',
              },
            },
          },
        }}
      >
        {(['light', 'dark', 'system'] as const).map((mode) => {
          const Icon = themeIcons[mode];
          const isSelected = themeMode === mode;

          return (
            <MenuItem
              key={mode}
              onClick={() => handleThemeSelect(mode)}
              selected={isSelected}
              sx={{
                fontWeight: isSelected ? 600 : 400,
                backgroundColor: isSelected ? 'action.selected' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon
                  fontSize="small"
                  sx={{
                    color: isSelected ? 'primary.main' : 'text.secondary',
                    transition: 'color 0.2s ease',
                  }}
                />
              </ListItemIcon>
              {showLabels && (
                <ListItemText
                  primary={t(`theme.${mode}`, themeLabels[mode])}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      color: isSelected ? 'primary.main' : 'text.primary',
                      transition: 'color 0.2s ease',
                    },
                  }}
                />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

/**
 * Simple theme toggle button that cycles between light/dark
 */
export function SimpleThemeToggle(props: Omit<ThemeToggleProps, 'variant'>) {
  return <ThemeToggle {...props} variant="toggle" />;
}

/**
 * Theme menu button with all options (light/dark/system)
 */
export function ThemeMenu(props: Omit<ThemeToggleProps, 'variant'>) {
  return <ThemeToggle {...props} variant="menu" />;
}
