import {
  createTheme,
  responsiveFontSizes,
  Theme,
  ThemeOptions,
  ComponentsOverrides,
} from '@mui/material';

// Color constants for better maintainability
const COLOR_CONSTANTS = {
  // Primary colors
  LIGHT_CYAN: '8, 145, 178', // Light mode cyan
  DARK_CYAN: '72, 219, 251', // Dark mode cyan
  BRIGHT_CYAN: '34, 211, 238', // Bright cyan for focus states

  // Border and text colors
  LIGHT_BORDER: '75, 85, 99', // Light mode border
  DARK_BORDER: '148, 163, 184', // Dark mode border
} as const;

// Base theme configuration shared between light and dark themes
const baseTheme = {
  typography: {
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none' as const,
    },
  },
  shape: {
    borderRadius: 8,
  },
} satisfies ThemeOptions;

// Define common component overrides function
const createComponents = (_mode: 'light' | 'dark'): ThemeOptions['components'] => ({
  MuiBox: {
    variants: [
      {
        props: { variant: 'systemMessage' },
        style: ({ theme, ownerState }: { theme: Theme; ownerState: any }) => {
          const { transparent = false, fullWidth = false } = ownerState;

          return {
            background: transparent
              ? theme.palette.systemMessage.transparent
              : theme.palette.systemMessage.main,
            border: 'none',
            borderRadius: 16,
            margin: '8px auto',
            alignSelf: 'center',
            padding: '8px 12px',
            width: 'fit-content',
            backdropFilter: transparent ? 'blur(4px)' : 'none',
            WebkitBackdropFilter: transparent ? 'blur(4px)' : 'none',
            transition: theme.transitions.create(['background-color', 'backdrop-filter'], {
              duration: theme.transitions.duration.short,
            }),
            ...(fullWidth && {
              maxWidth: '95%',
              width: 'auto',
            }),
            [theme.breakpoints.down('sm')]: {
              maxWidth: fullWidth ? '98%' : '95%',
            },
          };
        },
      },
    ],
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 16px',
        transition: 'all 0.3s ease',
        textTransform: 'none',
        fontWeight: 500,
        '&:hover': {
          transform: 'translateY(-1px)',
        },
      },
      contained: ({ theme }: { theme: Theme }) => {
        return {
          background: theme.palette.primary.main,
          boxShadow: 'none',
          '&:hover': {
            background: theme.palette.primary.dark,
            boxShadow: 'none',
            transform: 'translateY(-2px)',
          },
        };
      },
      outlined: ({ theme }: { theme: Theme }) => {
        const isLight = theme.palette.mode === 'light';
        return {
          borderColor: `rgba(${isLight ? COLOR_CONSTANTS.LIGHT_CYAN : COLOR_CONSTANTS.DARK_CYAN}, 0.5)`, // Use darker cyan for light mode
          color: theme.palette.primary.main,
          '&:hover': {
            borderColor: `rgba(${isLight ? COLOR_CONSTANTS.LIGHT_CYAN : COLOR_CONSTANTS.DARK_CYAN}, 0.8)`,
            background: `rgba(${isLight ? COLOR_CONSTANTS.LIGHT_CYAN : COLOR_CONSTANTS.DARK_CYAN}, 0.1)`,
            boxShadow: `0 0 20px rgba(${isLight ? COLOR_CONSTANTS.LIGHT_CYAN : COLOR_CONSTANTS.DARK_CYAN}, 0.3)`,
          },
        };
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: () => {
        return {
          borderRadius: 12,
          background: 'var(--container-background)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: '1px solid var(--container-border)',
          boxShadow: 'var(--shadow-lg)',
        };
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      elevation1: ({ theme }) => {
        const isLight = theme.palette.mode === 'light';
        return {
          boxShadow: isLight
            ? '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.1)'
            : '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        };
      },
      elevation2: ({ theme }) => {
        const isLight = theme.palette.mode === 'light';
        return {
          boxShadow: isLight
            ? '0 3px 6px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)'
            : '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
        };
      },
      elevation4: ({ theme }) => {
        const isLight = theme.palette.mode === 'light';
        return {
          boxShadow: isLight
            ? '0 10px 20px rgba(0, 0, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.05)'
            : '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
        };
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: ({ theme }) => {
        const isLight = theme.palette.mode === 'light';
        return {
          '& .MuiOutlinedInput-root': {
            transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            borderRadius: '8px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isLight
                ? `rgba(${COLOR_CONSTANTS.LIGHT_BORDER}, 0.4)`
                : `rgba(${COLOR_CONSTANTS.DARK_BORDER}, 0.23)`, // Darker border for light mode
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isLight
                ? `rgba(${COLOR_CONSTANTS.LIGHT_BORDER}, 0.6)`
                : theme.palette.primary.main,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              boxShadow: `0 0 0 2px rgba(${isLight ? COLOR_CONSTANTS.LIGHT_CYAN : COLOR_CONSTANTS.BRIGHT_CYAN}, 0.2)`,
            },
            '& input::placeholder': {
              color: isLight
                ? `rgba(${COLOR_CONSTANTS.LIGHT_BORDER}, 0.7)`
                : `rgba(${COLOR_CONSTANTS.DARK_BORDER}, 0.5)`, // Darker placeholder for light mode
              opacity: 1,
            },
            '& textarea::placeholder': {
              color: isLight
                ? `rgba(${COLOR_CONSTANTS.LIGHT_BORDER}, 0.7)`
                : `rgba(${COLOR_CONSTANTS.DARK_BORDER}, 0.5)`, // Darker placeholder for light mode
              opacity: 1,
            },
          },
          '& .MuiInputLabel-root': {
            color: isLight
              ? `rgba(${COLOR_CONSTANTS.LIGHT_BORDER}, 0.8)`
              : `rgba(${COLOR_CONSTANTS.DARK_BORDER}, 0.7)`, // Darker label for light mode
            '&.Mui-focused': {
              color: theme.palette.primary.main,
            },
          },
        };
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: ({ theme }) => {
        const isLight = theme.palette.mode === 'light';
        return {
          borderRadius: '8px',
          transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isLight
              ? `rgba(${COLOR_CONSTANTS.LIGHT_BORDER}, 0.4)`
              : `rgba(${COLOR_CONSTANTS.DARK_BORDER}, 0.23)`, // Darker border for light mode
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: isLight
              ? `rgba(${COLOR_CONSTANTS.LIGHT_BORDER}, 0.6)`
              : theme.palette.primary.main,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 2px rgba(${isLight ? COLOR_CONSTANTS.LIGHT_CYAN : COLOR_CONSTANTS.BRIGHT_CYAN}, 0.2)`,
          },
        };
      },
    },
    defaultProps: {
      MenuProps: {
        disableScrollLock: true,
        BackdropProps: {
          invisible: true,
        },
        PaperProps: {
          style: {
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          },
        },
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      switchBase: ({ theme }) => ({
        '&.Mui-checked': {
          color: theme.palette.primary.main,
          '& + .MuiSwitch-track': {
            backgroundColor: theme.palette.primary.main,
          },
        },
      }),
    },
  },
  MuiSlider: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.primary.main,
      }),
    },
  },
  MuiCssBaseline: {
    styleOverrides: {
      body: ({ theme }: { theme: Theme }) => {
        const isLight = theme.palette.mode === 'light';
        return {
          scrollbarWidth: 'thin',
          scrollbarColor: isLight ? '#d1d5db transparent' : '#4b5563 transparent',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: isLight ? '#d1d5db' : '#4b5563',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: isLight ? '#9ca3af' : '#6b7280',
          },
        };
      },
      // Add accessibility enhancements
      '*': {
        // High contrast mode support
        '@media (forced-colors: active)': {
          '&:focus': {
            outline: '2px solid ButtonText !important',
          },
        },
        // Reduced motion support
        '@media (prefers-reduced-motion: reduce)': {
          '&, &::before, &::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
      // Enhanced focus visibility for keyboard navigation
      '.keyboard-navigation *:focus': {
        outline: '2px solid #22d3ee',
        outlineOffset: '2px',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: () => {
        return {
          backgroundColor: 'var(--nav-background)',
          borderBottom: '1px solid var(--nav-border)',
          boxShadow: 'var(--nav-shadow)',
        };
      },
    },
  },
  MuiContainer: {
    styleOverrides: {
      root: () => {
        return {
          '&.gradient-background': {
            minHeight: '100vh',
            background: 'var(--page-gradient)',
            padding: '2rem 0',
          },
        };
      },
    },
  },
  MuiModal: {
    styleOverrides: {
      root: {
        '&:not(.MuiPopover-root)': {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        },
      },
    },
  },
  MuiPopover: {
    styleOverrides: {
      root: {
        '& .MuiModal-backdrop': {
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: () => {
        return {
          background: 'var(--color-surface)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--nav-border)',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'var(--shadow-lg)',
        };
      },
    },
  },
});

// Extend the MUI theme type to include custom colors
declare module '@mui/material/styles' {
  interface Palette {
    systemMessage: {
      main: string;
      transparent: string;
    };
  }

  interface PaletteOptions {
    systemMessage?: {
      main: string;
      transparent: string;
    };
  }
}

// Extend MUI Box to support custom variants
declare module '@mui/material/Box' {
  interface BoxPropsVariantOverrides {
    systemMessage: true;
  }
}

// Extend MUI theme components to include custom overrides
declare module '@mui/material/styles' {
  interface ComponentNameToClassKey {
    MuiBox: 'root';
  }

  interface Components<Theme = unknown> {
    MuiBox?: {
      variants?: Array<{
        props: Record<string, any>;
        style:
          | Record<string, any>
          | ((props: { theme: Theme; ownerState: any }) => Record<string, any>);
      }>;
    } & ComponentsOverrides<Theme>['MuiBox'];
  }
}

// Light theme configuration
const lightThemeOptions: ThemeOptions = {
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#0891b2', // Cyan 600 - darker for better contrast on light background
      dark: '#0e7490', // Cyan 700
      light: '#22d3ee', // Cyan 400
      contrastText: '#ffffff', // White text for better contrast
    },
    secondary: {
      main: '#06b6d4', // Cyan 500 - slightly darker for better light mode contrast
      dark: '#0e7490', // Cyan 700
      light: '#a5f3fc', // Cyan 200
      contrastText: '#ffffff', // White text for better contrast
    },
    background: {
      default: '#f8fafc', // Slate 50
      paper: '#ffffff', // Pure white
    },
    text: {
      primary: '#0f172a', // Slate 900
      secondary: '#475569', // Slate 600
    },
    divider: 'rgba(148, 163, 184, 0.2)', // Slate 400 with opacity for light mode
    error: {
      main: '#dc2626', // Red 600 - good contrast on light background
    },
    warning: {
      main: '#d97706', // Amber 600 - good contrast on light background
    },
    systemMessage: {
      main: 'rgba(148, 163, 184, 0.15)', // Slate 400 with low opacity for light mode
      transparent: 'rgba(148, 163, 184, 0.25)', // Slate 400 with higher opacity for transparent mode
    },
    info: {
      main: '#2563eb', // Blue 600 - good contrast on light background
    },
    success: {
      main: '#059669', // Emerald 600 - good contrast on light background
    },
  },
};

// Dark theme configuration (existing theme adapted)
const darkThemeOptions: ThemeOptions = {
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#22d3ee', // Cyan 400
      dark: '#0891b2', // Cyan 600
      light: '#67e8f9', // Cyan 300
    },
    secondary: {
      main: '#48dbfb', // Brand teal
      dark: '#0e7490', // Cyan 700
      light: '#a5f3fc', // Cyan 200
    },
    background: {
      default: '#0f172a', // Slate 900
      paper: '#1e293b', // Slate 800
    },
    text: {
      primary: '#f8fafc', // Slate 50
      secondary: '#cbd5e1', // Slate 300
    },
    divider: 'rgba(148, 163, 184, 0.12)', // Slate 400 with opacity
    error: {
      main: '#b91c1c', // Darker red
    },
    warning: {
      main: '#b45309', // Darker amber
    },
    systemMessage: {
      main: 'rgba(148, 163, 184, 0.1)', // Slate 400 with low opacity
      transparent: 'rgba(148, 163, 184, 0.2)', // Slate 400 with higher opacity for transparent mode
    },
    info: {
      main: '#1d4ed8', // Darker blue
    },
    success: {
      main: '#047857', // Darker emerald
    },
  },
};

// Create themes with components
const createThemeWithComponents = (themeOptions: ThemeOptions): Theme => {
  const baseTheme = createTheme(themeOptions);
  return createTheme({
    ...baseTheme,
    components: createComponents(themeOptions.palette!.mode as 'light' | 'dark'),
  });
};

// Export both themes
export const lightTheme = responsiveFontSizes(createThemeWithComponents(lightThemeOptions));
export const darkTheme = responsiveFontSizes(createThemeWithComponents(darkThemeOptions));

// Export default dark theme for backward compatibility
export default darkTheme;

// Helper function to get theme by mode
export const getThemeByMode = (mode: 'light' | 'dark'): Theme => {
  return mode === 'light' ? lightTheme : darkTheme;
};
