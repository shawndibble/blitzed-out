import { Box, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';

interface TabPanelProps {
  children: ReactNode;
  value: number;
  index: number;
  style?: SxProps<Theme>;
  overflow?: 'auto' | 'hidden' | 'scroll' | 'visible';
  [key: string]: any;
}

export default function TabPanel({
  children,
  value,
  index,
  style,
  overflow,
  ...other
}: TabPanelProps): JSX.Element {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            p: 3,
            ...(overflow && { overflow }),
            ...style,
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}
