import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  // Ativa as variáveis de CSS para melhor performance no MUI 7
  cssVariables: true, 
  palette: {
    primary: {
      main: '#1a237e', // Azul escuro (Confiança/Tradição)
      light: '#534bae',
      dark: '#000051',
      contrastText: '#fff',
    },
    secondary: {
      main: '#d4af37', // Dourado (Graduação/Conquista)
      light: '#ffdf70',
      dark: '#a08100',
      contrastText: '#000',
    },
    warning: {
      main: '#ff9800', // Laranja para alertas de aprovação
    },
    background: {
      default: '#f4f6f8', // Cinza muito claro para o fundo das páginas
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none', // Remove o Caps Lock automático dos botões
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8, // Bordas levemente arredondadas para um ar moderno
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a237e',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4, // Botões mais quadrados ou redondos conforme preferir
        },
      },
    },
  },
});

export default theme;