import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import './styles/globals.css'
import './styles/login.css'
import './styles/management.css'
import './styles/dashboard.css'
import './styles/doctor.css'

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
