import { Box, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';

interface TabPanelProps {
  children: ReactNode;
  value: number;
  index: number;
  style?: SxProps<Theme>;
  [key: string]: any;
}

export default function TabPanel({
  children,
  value,
  index,
  style,
  ...other
}: TabPanelProps): JSX.Element {
  // Without `minHeight: 0` a flex item floors at its content size, leaving the
  // scrolling Box below unbounded and its overflow clipped with no way to reach it.
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            p: 3,
            height: '100%',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            ...style,
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}
