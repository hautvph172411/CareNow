import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./contexts/AuthContext";
import SessionWarning from "./components/SessionWarning";
import './styles/globals.css'
import './styles/login.css'
import './styles/management.css'
import './styles/dashboard.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <SessionWarning />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
