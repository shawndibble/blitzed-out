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
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ height: '100%', overflow: 'hidden' }}
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
