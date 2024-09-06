import { Box } from '@mui/material';

export default function ButtonRow({ children, justifyContent = 'space-evenly' }) {
  return (
    <Box
      sx={{
        mt: 3,
        display: 'flex',
        flexDirection: 'row',
        justifyContent,
        alignItems: 'center',
      }}
    >
      {children}
    </Box>
  );
}
