// app/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#ffffff',
      paper: '#ffffff'
    },
    text: {
      primary: '#000000',
      secondary: '#333333'
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#ffffff' }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' } // ダークの模様を消す用
      }
    }
  }
});

export default theme;
