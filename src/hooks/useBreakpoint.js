import { useMediaQuery, useTheme } from '@mui/material';

export default function useBreakpoint(breakpoint = 'sm') {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down(breakpoint));
}
