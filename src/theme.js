import { createTheme, responsiveFontSizes } from '@mui/material';

let darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});
darkTheme = responsiveFontSizes(darkTheme);

export default darkTheme;