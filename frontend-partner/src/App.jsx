import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./contexts/AuthContext";

import './styles/globals.css'
import './styles/dashboard.css'
import './styles/management.css'
import './styles/login.css'
import './styles/modal.css'
import './styles/image-upload.css'
import './styles/partner-theme.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
