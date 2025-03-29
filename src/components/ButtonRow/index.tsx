import { Box } from '@mui/material';
import { ButtonRowProps } from '@/types';

export default function ButtonRow({ children, justifyContent = 'space-evenly' }: ButtonRowProps) {
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
