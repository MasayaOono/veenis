import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#FAF7F2", // ← Serene Sand
      paper: "#FFFFFF",
    },
    primary: { main: "#E85D8C" }, // Rose
    secondary: { main: "#7056B5" }, // Lavender
    text: {
      primary: "#2B2B2B",
      secondary: "rgba(0,0,0,0.6)",
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: ["Inter", "system-ui", "Noto Sans JP", "sans-serif"].join(","),
  },
  components: {
    // ① OutlinedInput（TextField/Select の実体）
    MuiOutlinedInput: {
      styleOverrides: {
        // 競合に勝つために "&&" で specificity を上げる
        root: {
          "&&": {
            borderRadius: 14,
          },
          // fieldset（ノッチ枠）に直接
          "& fieldset": { borderRadius: 14 },
          "&:hover fieldset": { borderRadius: 14 },
          "&.Mui-focused fieldset": { borderRadius: 14 },
        },
        input: {
          borderRadius: 14,
        },
      },
    },
    // ② TextField からも内側の OutlinedInput を叩く
    MuiTextField: {
      styleOverrides: {
        root: {
          // これで TextField 側からも一網打尽
          "& .MuiOutlinedInput-root": { borderRadius: 14 },
          "& .MuiOutlinedInput-root fieldset": { borderRadius: 14 },
        },
      },
    },
    // ③ Autocomplete を使うなら
    MuiAutocomplete: {
      styleOverrides: {
        inputRoot: {
          "&": { borderRadius: 14 },
          "& fieldset": { borderRadius: 14 },
        },
      },
    },
  },
});

export default theme;
