import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { Container, AppBar, Toolbar, Typography, Button, Box } from "@mui/material"
import { Link, useLocation } from "react-router-dom"
import { URLProvider } from "./context/URLContext"
import URLShortenerPage from "./pages/URLShortenerPage"
import StatisticsPage from "./pages/StatisticsPage"
import RedirectHandler from "./components/RedirectHandler"
import "./App.css"

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
})

function Navigation() {
  const location = useLocation()

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          URL Shortener
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            color="inherit"
            component={Link}
            to="/shortener"
            variant={location.pathname === "/shortener" ? "outlined" : "text"}
          >
            Shortener
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/statistics"
            variant={location.pathname === "/statistics" ? "outlined" : "text"}
          >
            Statistics
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <URLProvider>
        <Router>
          <div className="App">
            <Navigation />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              <Routes>
                <Route path="/" element={<Navigate to="/shortener" replace />} />
                <Route path="/shortener" element={<URLShortenerPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
                <Route path="/s/:shortCode" element={<RedirectHandler />} />
              </Routes>
            </Container>
          </div>
        </Router>
      </URLProvider>
    </ThemeProvider>
  )
}

export default App
