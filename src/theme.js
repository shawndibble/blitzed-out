import { createTheme, responsiveFontSizes } from '@mui/material';

let darkTheme = createTheme({
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
    info: {
      main: '#1d4ed8', // Darker blue
    },
    success: {
      main: '#047857', // Darker emerald
    },
  },
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
      textTransform: 'none',
    },
  },
  components: {
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
        contained: {
          background: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 50%, #0e7490 100%)',
          boxShadow: '0 4px 16px rgba(34, 211, 238, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
            boxShadow: '0 6px 24px rgba(34, 211, 238, 0.5)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: 'rgba(72, 219, 251, 0.5)',
          color: '#48dbfb',
          '&:hover': {
            borderColor: 'rgba(72, 219, 251, 0.8)',
            background: 'rgba(72, 219, 251, 0.1)',
            boxShadow: '0 0 20px rgba(72, 219, 251, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: 'rgba(30, 41, 59, 0.9)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 16px 56px rgba(0, 0, 0, 0.5), 0 6px 24px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        },
        elevation2: {
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
        },
        elevation4: {
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            borderRadius: '8px',
            '&:hover': {
              borderColor: '#22d3ee',
            },
            '&.Mui-focused': {
              borderColor: '#22d3ee',
              boxShadow: '0 0 0 2px rgba(34, 211, 238, 0.2)',
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#22d3ee',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#22d3ee',
            boxShadow: '0 0 0 2px rgba(34, 211, 238, 0.2)',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: '#22d3ee',
            '& + .MuiSwitch-track': {
              backgroundColor: '#22d3ee',
            },
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: '#22d3ee',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#4b5563 #1f2937',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#1f2937',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#4b5563',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#6b7280',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '&.gradient-background': {
            minHeight: '100vh',
            background:
              'linear-gradient(135deg, #0f172a 0%, #1e293b 20%, #334155 40%, #1e293b 60%, #0f172a 80%, #020617 100%)',
            padding: '2rem 0',
          },
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          boxShadow:
            '0 20px 80px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 30px rgba(34, 211, 238, 0.1)',
        },
      },
    },
  },
});
darkTheme = responsiveFontSizes(darkTheme);

export default darkTheme;
