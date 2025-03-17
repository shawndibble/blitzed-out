import { useMediaQuery, useTheme } from '@mui/material';
import { Breakpoint } from '@mui/material/styles';

export default function useBreakpoint(breakpoint: Breakpoint = 'sm'): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down(breakpoint));
}
