import { Box } from '@mui/material';

export default function TabPanel({
  children, value, index, style, ...other
}) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, ...style }}>
          {children}
        </Box>
      )}
    </div>
  );
}
